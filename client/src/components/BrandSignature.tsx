import { Info } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const BrandSignature = () => {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <div className="flex items-center space-x-2">
      <a 
        href="https://ezprofitsoftware.com/lazy-marketers-dream-come-true/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-semibold text-blue-500 hover:underline whitespace-nowrap"
      >
        🚀 by <span className="font-bold">Lee Cole & Gloria Gunn</span>
      </a>
      <button
        onClick={() => setShowAbout(true)}
        className="text-blue-500 hover:text-blue-700 transition-colors"
        aria-label="About Leadstorm AI"
      >
        <Info className="w-4 h-4" />
      </button>

      <Dialog open={showAbout} onOpenChange={setShowAbout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold mb-2">
              Leadstorm AI Lead Generator
            </DialogTitle>
            <DialogDescription className="space-y-2 text-left">
              <p>© 2025 LinkedSure LLC</p>
              <p>Created by Lee Cole & Gloria Gunn for the Leadstorm marketing suite.</p>
              <p>
                <a 
                  className="text-blue-500 underline hover:text-blue-700" 
                  href="https://ezprofitsoftware.com/lazy-marketers-dream-come-true/" 
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get updates, bonuses & tutorials
                </a>
              </p>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};