import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/translations";

interface HelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpModal({ open, onOpenChange }: HelpModalProps) {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <HelpCircle className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl font-display tracking-wide text-primary">
              {t.help.title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          <p className="text-zinc-300 text-base leading-relaxed">
            {t.help.description}
          </p>
          
          <div className="pt-4">
            <Button 
              onClick={() => onOpenChange(false)}
              className="w-full bg-primary text-black hover:bg-primary/90 font-bold"
            >
              OK
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
