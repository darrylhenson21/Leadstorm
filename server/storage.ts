import { leads, runs, configurations, type Lead, type InsertLead, type Run, type InsertRun, type Configuration, type InsertConfiguration } from "@shared/schema";

export interface IStorage {
  // Leads
  getLeads(): Promise<Lead[]>;
  addLead(lead: InsertLead): Promise<Lead>;
  isExistingLead(placeId: string, phone?: string): Promise<boolean>;
  getLeadsByRun(runId: number): Promise<Lead[]>;
  clearAllLeads(): Promise<void>;
  
  // Runs
  getRuns(): Promise<Run[]>;
  createRun(run: InsertRun): Promise<Run>;
  updateRun(id: number, updates: Partial<Run>): Promise<Run>;
  getRunById(id: number): Promise<Run | undefined>;
  clearAllRuns(): Promise<void>;
  
  // Configuration
  getConfiguration(): Promise<Configuration | undefined>;
  updateConfiguration(config: InsertConfiguration): Promise<Configuration>;
}

export class MemStorage implements IStorage {
  private leads: Map<number, Lead>;
  private runs: Map<number, Run>;
  private configuration: Configuration | undefined;
  private currentLeadId: number;
  private currentRunId: number;

  constructor() {
    this.leads = new Map();
    this.runs = new Map();
    this.currentLeadId = 1;
    this.currentRunId = 1;
    this.configuration = {
      id: 1,
      googlePlacesKey: process.env.GOOGLE_PLACES_KEY || null,
      defaultCity: process.env.DEFAULT_CITY || "New York",
      defaultKeyword: process.env.DEFAULT_KEYWORD || "restaurants",
      dailyCap: parseInt(process.env.DAILY_CAP || "50"),
      requestDelay: parseInt(process.env.REQUEST_DELAY || "1000"),
      maxRunDuration: parseInt(process.env.MAX_RUN_DURATION || "30"),
      retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || "3"),
      backoffMultiplier: parseInt(process.env.BACKOFF_MULTIPLIER || "2"),
      enableUserAgentRotation: true,
      updatedAt: new Date(),
    };
  }

  async getLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async addLead(insertLead: InsertLead): Promise<Lead> {
    const id = this.currentLeadId++;
    const lead: Lead = {
      id,
      placeId: insertLead.placeId,
      name: insertLead.name || null,
      email: insertLead.email || null,
      phone: insertLead.phone || null,
      website: insertLead.website || null,
      address: insertLead.address || null,
      city: insertLead.city || null,
      keyword: insertLead.keyword || null,
      createdAt: new Date(),
    };
    this.leads.set(id, lead);
    return lead;
  }

  async isExistingLead(placeId: string, phone?: string): Promise<boolean> {
    return Array.from(this.leads.values()).some(lead => 
      lead.placeId === placeId || (phone && lead.phone === phone)
    );
  }

  async getLeadsByRun(runId: number): Promise<Lead[]> {
    // For this implementation, we'd need to track runId in leads
    // For now, return empty array
    return [];
  }

  async getRuns(): Promise<Run[]> {
    return Array.from(this.runs.values()).sort((a, b) => 
      new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime()
    );
  }

  async createRun(insertRun: InsertRun): Promise<Run> {
    const id = this.currentRunId++;
    const run: Run = {
      id,
      city: insertRun.city,
      keyword: insertRun.keyword,
      leadsAdded: insertRun.leadsAdded || null,
      duplicates: insertRun.duplicates || null,
      noEmail: insertRun.noEmail || null,
      status: insertRun.status,
      startedAt: new Date(),
      completedAt: null,
      errorMessage: insertRun.errorMessage || null,
    };
    this.runs.set(id, run);
    return run;
  }

  async updateRun(id: number, updates: Partial<Run>): Promise<Run> {
    const existingRun = this.runs.get(id);
    if (!existingRun) {
      throw new Error(`Run with id ${id} not found`);
    }
    
    const updatedRun = { ...existingRun, ...updates };
    this.runs.set(id, updatedRun);
    return updatedRun;
  }

  async getRunById(id: number): Promise<Run | undefined> {
    return this.runs.get(id);
  }

  async getConfiguration(): Promise<Configuration | undefined> {
    return this.configuration;
  }

  async updateConfiguration(config: InsertConfiguration): Promise<Configuration> {
    this.configuration = {
      id: 1,
      googlePlacesKey: config.googlePlacesKey || null,
      defaultCity: config.defaultCity || null,
      defaultKeyword: config.defaultKeyword || null,
      dailyCap: config.dailyCap || null,
      requestDelay: config.requestDelay || null,
      maxRunDuration: config.maxRunDuration || null,
      retryAttempts: config.retryAttempts || null,
      backoffMultiplier: config.backoffMultiplier || null,
      enableUserAgentRotation: config.enableUserAgentRotation || null,
      updatedAt: new Date(),
    };
    return this.configuration;
  }

  async clearAllLeads(): Promise<void> {
    this.leads.clear();
    this.currentLeadId = 1;
  }

  async clearAllRuns(): Promise<void> {
    this.runs.clear();
    this.currentRunId = 1;
  }
}

export const storage = new MemStorage();
