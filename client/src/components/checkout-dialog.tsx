import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  price: string;
  onSuccess: () => void;
}

export function CheckoutDialog({ open, onOpenChange, productName, price, onSuccess }: CheckoutDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"details" | "payment" | "success">("details");

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("details");
        setIsLoading(false);
      }, 300);
    }
  }, [open]);

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate Stripe processing
    setTimeout(() => {
      setIsLoading(false);
      setStep("success");
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
      }, 1500);
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-display tracking-wide text-primary">
            {step === "success" ? "Payment Successful" : `Checkout: ${productName}`}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {step === "details" && "Enter your details to proceed."}
            {step === "payment" && "Secure payment via Stripe."}
            {step === "success" && "Redirecting you to your product..."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <AnimatePresence mode="wait">
            {step === "details" && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input placeholder="you@example.com" className="bg-zinc-900 border-zinc-800 focus:border-primary/50" />
                </div>
                <div className="space-y-2">
                  <Label>Discord Username (Optional)</Label>
                  <Input placeholder="username#0000" className="bg-zinc-900 border-zinc-800 focus:border-primary/50" />
                </div>
                <div className="pt-4 flex justify-end">
                  <Button onClick={() => setStep("payment")} className="w-full bg-primary text-black hover:bg-primary/90 font-bold">
                    Continue to Payment
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "payment" && (
              <motion.form
                key="payment"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handlePayment}
                className="space-y-4"
              >
                <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-zinc-400">Total Amount</span>
                    <span className="text-xl font-mono font-bold text-white">{price}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Card Information</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Input placeholder="0000 0000 0000 0000" className="pl-9 bg-zinc-900 border-zinc-800 font-mono" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="MM/YY" className="bg-zinc-900 border-zinc-800 font-mono" />
                    <Input placeholder="CVC" className="bg-zinc-900 border-zinc-800 font-mono" />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-primary text-black hover:bg-primary/90 font-bold mt-4"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Pay {price}
                    </>
                  )}
                </Button>
                
                <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 mt-2">
                  <Lock className="h-3 w-3" />
                  Secured by Stripe
                </div>
              </motion.form>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 space-y-4"
              >
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <p className="text-center text-zinc-300">
                  Transaction completed successfully!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Check } from "lucide-react";
