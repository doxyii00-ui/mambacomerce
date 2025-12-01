import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, Lock, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  price: string;
  productId: string;
  onSuccess: (email: string) => void;
}

export function CheckoutDialog({ open, onOpenChange, productName, price, productId, onSuccess }: CheckoutDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"details" | "payment" | "success">("details");
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState<string>("");
  const [generatorLink, setGeneratorLink] = useState<string>("");

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("details");
        setIsLoading(false);
        setEmail("");
        setAccessCode("");
        setGeneratorLink("");
      }, 300);
    }
  }, [open]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !productId) return;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Invalid email format");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create order in database with sanitized data
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          productId: productId.trim(),
          productName: productName.trim(),
          price: price.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      const order = await response.json();

      // Store order ID and email in localStorage for later verification
      if (order.id && typeof order.id === "string") {
        localStorage.setItem("mamba_order_id", order.id);
        localStorage.setItem("mamba_order_email", email.toLowerCase());
      }
      
      // Claim access code
      try {
        const codeResponse = await fetch("/api/access-code/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.toLowerCase(),
            productId: productId,
          }),
        });

        if (codeResponse.ok) {
          const codeData = await codeResponse.json();
          setAccessCode(codeData.code);
          setGeneratorLink(codeData.generatorLink);
        }
      } catch (error) {
        console.error("Failed to claim code:", error);
      }
      
      setIsLoading(false);
      setStep("success");
      setTimeout(() => {
        onSuccess(email);
      }, 3000);
    } catch (error) {
      console.error("Payment error:", error);
      setIsLoading(false);
    }
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
                  <Input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" 
                    className="bg-zinc-900 border-zinc-800 focus:border-primary/50" 
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discord Username (Optional)</Label>
                  <Input placeholder="username#0000" className="bg-zinc-900 border-zinc-800 focus:border-primary/50" />
                </div>
                <div className="pt-4 flex justify-end">
                  <Button onClick={() => setStep("payment")} disabled={!email} className="w-full bg-primary text-black hover:bg-primary/90 font-bold disabled:opacity-50">
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
                className="flex flex-col items-center justify-center py-8 space-y-6"
              >
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-display font-bold text-primary mb-2">Dziękujemy!</p>
                  <p className="text-sm text-zinc-400">Twoja transakcja została potwierdzona</p>
                </div>
                
                {accessCode && (
                  <div className="w-full mt-4 space-y-3">
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                      <p className="text-xs text-zinc-400 mb-2">Kod dostępu:</p>
                      <p className="text-lg font-mono font-bold text-primary break-all">{accessCode}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(accessCode);
                        }}
                        className="mt-3 w-full px-3 py-2 text-xs bg-primary text-black hover:bg-primary/90 rounded font-bold transition-colors"
                      >
                        Skopiuj kod
                      </button>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2">
                      <p className="text-sm font-bold text-white">Instrukcja:</p>
                      <ol className="text-xs text-zinc-300 space-y-1 list-decimal list-inside">
                        <li>Skopiuj kod dostępu wyżej</li>
                        <li>Przejdź na: <span className="text-primary font-mono break-all">{generatorLink}</span></li>
                        <li>Wklej kod i postępuj zgodnie z instrukcjami</li>
                      </ol>
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-zinc-500 text-center">
                  Kod został wysłany też na email: <span className="text-zinc-300">{email}</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
