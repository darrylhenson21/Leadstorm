import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRunSchema, insertConfigurationSchema } from "@shared/schema";
import { fetchPlaces, fetchPlaceDetails, delay } from "./services/googlePlaces";
import { scrapeEmailFromWebsite } from "./services/scraper";
import { z } from "zod";

// Global tracking for running processes
const currentRuns = new Map<number, { status: string, stopRequested?: boolean }>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Get configuration
  app.get("/api/configuration", async (req, res) => {
    try {
      const config = await storage.getConfiguration();
      if (!config) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      
      // Don't expose sensitive keys in the response
      const safeConfig = {
        ...config,
        googlePlacesKey: config.googlePlacesKey ? "***CONFIGURED***" : null,
      };
      
      res.json(safeConfig);
    } catch (error) {
      console.error("Error fetching configuration:", error);
      res.status(500).json({ message: "Failed to fetch configuration" });
    }
  });

  // Update configuration
  app.post("/api/configuration", async (req, res) => {
    try {
      const validatedData = insertConfigurationSchema.parse(req.body);
      const config = await storage.updateConfiguration(validatedData);
      
      // Don't expose sensitive keys in the response
      const safeConfig = {
        ...config,
        googlePlacesKey: config.googlePlacesKey ? "***CONFIGURED***" : null,
      };
      
      res.json(safeConfig);
    } catch (error) {
      console.error("Error updating configuration:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid configuration data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update configuration" });
    }
  });

  // Get all leads
  app.get("/api/leads", async (req, res) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  // Export leads as CSV
  app.get("/api/leads/export", async (req, res) => {
    try {
      const leads = await storage.getLeads();
      
      // Brand protection header comment
      const brandHeader = '# Exported from Leadstorm AI – https://ezprofitsoftware.com/lazy-marketers-dream-come-true/\r\n';
      
      const header = ['Date', 'Name', 'Email', 'Phone', 'Website', 'Address', 'City', 'Keyword'];
      const rows = leads.map(lead => [
        lead.createdAt ? new Date(lead.createdAt).toISOString().split('T')[0] : '',
        lead.name || '',
        lead.email || '',
        lead.phone || '',
        lead.website || '',
        lead.address || '',
        lead.city || '',
        lead.keyword || ''
      ]);
      
      const csv = brandHeader + [header, ...rows]
        .map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
        .join('\n');
      
      res.setHeader('Content-Disposition', 'attachment; filename=leadstorm_leads.csv');
      res.setHeader('Content-Type', 'text/csv');
      res.send(csv);
    } catch (error) {
      console.error("Error exporting leads:", error);
      res.status(500).json({ message: "Failed to export leads" });
    }
  });

  // Clear all data
  app.delete("/api/clear-history", async (req, res) => {
    try {
      await storage.clearAllLeads();
      await storage.clearAllRuns();
      res.json({ message: "History cleared successfully" });
    } catch (error) {
      console.error("Error clearing history:", error);
      res.status(500).json({ message: "Failed to clear history" });
    }
  });

  // Get all runs
  app.get("/api/runs", async (req, res) => {
    try {
      const runs = await storage.getRuns();
      res.json(runs);
    } catch (error) {
      console.error("Error fetching runs:", error);
      res.status(500).json({ message: "Failed to fetch runs" });
    }
  });

  // Start a new run
  app.post("/api/runs", async (req, res) => {
    try {
      const { city, keyword, maxLeads } = req.body;
      
      if (!city || !keyword) {
        return res.status(400).json({ message: "City and keyword are required" });
      }

      const config = await storage.getConfiguration();
      if (!config?.googlePlacesKey) {
        return res.status(400).json({ message: "Google Places API key not configured" });
      }

      const run = await storage.createRun({
        city,
        keyword,
        status: 'running',
        leadsAdded: 0,
        duplicates: 0,
        noEmail: 0,
        errorMessage: null,
      });

      // Start the lead generation process in the background
      runLeadGeneration(run.id, city, keyword, config, maxLeads || config.dailyCap);

      console.log(`Started run ${run.id} for ${city} + ${keyword}`);
      res.json(run);
    } catch (error) {
      console.error("Error starting run:", error);
      res.status(500).json({ message: "Failed to start run" });
    }
  });

  // Stop a running run
  app.post("/api/runs/:id/stop", async (req, res) => {
    try {
      const runId = parseInt(req.params.id);
      const run = await storage.getRunById(runId);
      
      if (!run) {
        return res.status(404).json({ message: "Run not found" });
      }
      
      if (run.status !== 'running') {
        return res.status(400).json({ message: "Run is not currently running" });
      }

      // Set stop flag if run is active
      if (currentRuns.has(runId)) {
        currentRuns.get(runId)!.stopRequested = true;
        console.log(`Stop requested for run ${runId}`);
      }

      // Update run status immediately
      await storage.updateRun(runId, {
        status: 'stopped',
        completedAt: new Date(),
      });

      console.log(`Run ${runId} marked as stopped`);
      res.json({ message: "Run stopped successfully" });
    } catch (error) {
      console.error("Error stopping run:", error);
      res.status(500).json({ message: "Failed to stop run" });
    }
  });

  // Get run by ID
  app.get("/api/runs/:id", async (req, res) => {
    try {
      const runId = parseInt(req.params.id);
      const run = await storage.getRunById(runId);
      
      if (!run) {
        return res.status(404).json({ message: "Run not found" });
      }
      
      res.json(run);
    } catch (error) {
      console.error("Error fetching run:", error);
      res.status(500).json({ message: "Failed to fetch run" });
    }
  });

  // Manual run endpoint (for external scheduling)
  app.get("/api/run", async (req, res) => {
    try {
      const { city, keyword } = req.query;
      
      if (!city || !keyword) {
        return res.status(400).json({ message: "City and keyword query parameters are required" });
      }

      const config = await storage.getConfiguration();
      if (!config?.googlePlacesKey) {
        return res.status(400).json({ message: "Google Places API key not configured" });
      }

      const run = await storage.createRun({
        city: city as string,
        keyword: keyword as string,
        status: 'running',
        leadsAdded: 0,
        duplicates: 0,
        noEmail: 0,
        errorMessage: null,
      });

      // Start the lead generation process
      const result = await performLeadGeneration(run.id, city as string, keyword as string, config);
      
      res.json({
        status: 'success',
        summary: {
          added: result.leadsAdded,
          duplicates: result.duplicates,
          noEmail: result.noEmail
        }
      });
    } catch (error) {
      console.error("Error in manual run:", error);
      res.status(500).json({ message: "Failed to execute run" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const leads = await storage.getLeads();
      const runs = await storage.getRuns();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaysLeads = leads.filter(lead => 
        lead.createdAt && new Date(lead.createdAt) >= today
      );
      
      const completedRuns = runs.filter(run => run.status === 'completed');
      const successRate = runs.length > 0 ? (completedRuns.length / runs.length) * 100 : 0;
      const avgLeadsPerRun = completedRuns.length > 0 
        ? completedRuns.reduce((sum, run) => sum + (run.leadsAdded || 0), 0) / completedRuns.length 
        : 0;

      res.json({
        totalLeads: leads.length,
        todaysLeads: todaysLeads.length,
        totalRuns: runs.length,
        successRate: Math.round(successRate),
        avgLeadsPerRun: Math.round(avgLeadsPerRun)
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Background lead generation function
async function runLeadGeneration(
  runId: number, 
  city: string, 
  keyword: string, 
  config: any, 
  maxLeads: number
): Promise<void> {
  currentRuns.set(runId, { status: 'running' });
  console.log(`Run ${runId} added to currentRuns tracker`);
  
  try {
    await performLeadGeneration(runId, city, keyword, config, maxLeads);
    currentRuns.delete(runId);
    console.log(`Run ${runId} completed and removed from tracker`);
  } catch (error) {
    console.error(`Error in background lead generation for run ${runId}:`, error);
    currentRuns.delete(runId);
    await storage.updateRun(runId, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      completedAt: new Date(),
    });
  }
}

async function performLeadGeneration(
  runId: number, 
  city: string, 
  keyword: string, 
  config: any, 
  maxLeads?: number
): Promise<{ leadsAdded: number; duplicates: number; noEmail: number }> {
  const dailyCap = maxLeads || config.dailyCap || 50;
  let leadsAdded = 0;
  let duplicates = 0;
  let noEmail = 0;

  try {
    // Fetch places from Google Places API
    const places = await fetchPlaces(city, keyword, config.googlePlacesKey);
    
    for (const place of places) {
      // Check if stop was requested
      const runState = currentRuns.get(runId);
      if (runState?.stopRequested) {
        console.log(`Run ${runId} stopped by user request`);
        break;
      }

      if (leadsAdded >= dailyCap) break;

      // Apply request delay
      if (config.requestDelay) {
        await delay(config.requestDelay);
      }

      // Check if this is a duplicate
      const isDuplicate = await storage.isExistingLead(place.place_id, place.international_phone_number);
      if (isDuplicate) {
        duplicates++;
        continue;
      }

      // Get detailed information if needed
      let placeDetails = place;
      if (!place.website) {
        const details = await fetchPlaceDetails(place.place_id, config.googlePlacesKey);
        if (details) {
          placeDetails = { ...place, ...details };
        }
      }

      // Try to scrape email from website
      let email = null;
      if (placeDetails.website) {
        email = await scrapeEmailFromWebsite(
          placeDetails.website,
          config.requestDelay || 1000,
          config.retryAttempts || 3,
          config.backoffMultiplier || 2
        );
      }

      if (!email) {
        noEmail++;
        continue;
      }

      // Add the lead
      await storage.addLead({
        placeId: placeDetails.place_id,
        name: placeDetails.name,
        email,
        phone: placeDetails.international_phone_number || null,
        website: placeDetails.website || null,
        address: placeDetails.formatted_address,
        city,
        keyword,
      });

      leadsAdded++;
    }

    // Update run with final results
    await storage.updateRun(runId, {
      status: 'completed',
      leadsAdded,
      duplicates,
      noEmail,
      completedAt: new Date(),
    });

    console.log(`Run ${runId} completed: ${leadsAdded} leads added, ${duplicates} duplicates, ${noEmail} no email`);
    
    return { leadsAdded, duplicates, noEmail };
  } catch (error) {
    console.error(`Error in lead generation for run ${runId}:`, error);
    
    await storage.updateRun(runId, {
      status: 'failed',
      leadsAdded,
      duplicates,
      noEmail,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      completedAt: new Date(),
    });

    throw error;
  }
}
