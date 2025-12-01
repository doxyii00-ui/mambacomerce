import { Layout } from "@/components/layout";
import { ProductCard } from "@/components/product-card";
import { CheckoutDialog } from "@/components/checkout-dialog";
import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import mambaLogo from "@assets/generated_images/futuristic_glowing_green_mamba_snake_logo.png";
import obywatelBg from "@assets/generated_images/cyberpunk_digital_id_card_abstract_background.png";
import receiptsBg from "@assets/generated_images/cyberpunk_digital_receipt_abstract_background.png";
import heroBg from "@assets/generated_images/dark_cyberpunk_digital_grid_hero_background.png";

export default function Home() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ name: string; price: string; id: string } | null>(null);
  const [_, setLocation] = useLocation();

  const handleBuy = (product: { name: string; price: string; id: string }) => {
    setSelectedProduct(product);
    setCheckoutOpen(true);
  };

  const handleSuccess = () => {
    if (selectedProduct) {
      // Save mock purchase
      const purchases = JSON.parse(localStorage.getItem("mamba_purchases") || "[]");
      if (!purchases.includes(selectedProduct.id)) {
        purchases.push(selectedProduct.id);
        localStorage.setItem("mamba_purchases", JSON.stringify(purchases));
      }
      setLocation("/dashboard");
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
            <img src={heroBg} alt="Background" className="w-full h-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        </div>
        
        <div className="container mx-auto px-4 z-10 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <img 
              src={mambaLogo} 
              alt="Mamba" 
              className="h-32 w-32 mx-auto mb-8 drop-shadow-[0_0_30px_hsl(142_70%_50%_/_0.3)] animate-pulse" 
            />
            <h1 className="text-5xl md:text-7xl font-display font-black text-white tracking-tight mb-6 leading-tight">
              AUTOMATE YOUR <br />
              <span className="text-primary text-glow">DIGITAL IDENTITY</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-light">
              Premium automated services for MambaObywatel and MambaReceipts. 
              Instant delivery via Discord integration.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 bg-black/20 backdrop-blur-sm relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">OUR PRODUCTS</h2>
            <div className="h-1 w-20 bg-primary mx-auto rounded-full shadow-[0_0_10px_hsl(142_70%_50%)]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <ProductCard 
              title="MambaObywatel"
              price="$19.99"
              description="Complete automation for citizen identity management. Generate valid data formats instantly."
              image={obywatelBg}
              features={[
                "Instant Data Generation",
                "Automated Form Filling",
                "Secure Encryption",
                "24/7 Discord Support"
              ]}
              accentColor="primary"
              onBuy={() => handleBuy({ name: "MambaObywatel", price: "$19.99", id: "obywatel" })}
            />

            <ProductCard 
              title="MambaReceipts"
              price="$14.99 / mo"
              description="Professional receipt generation tool. Perfect for expense tracking and validation."
              image={receiptsBg}
              features={[
                "Custom Merchant Data",
                "Valid Checksums",
                "Multiple Templates",
                "Discord Bot Integration"
              ]}
              accentColor="secondary"
              onBuy={() => handleBuy({ name: "MambaReceipts", price: "$14.99 / mo", id: "receipts" })}
            />
          </div>
        </div>
      </section>

      <CheckoutDialog 
        open={checkoutOpen} 
        onOpenChange={setCheckoutOpen}
        productName={selectedProduct?.name || ""}
        price={selectedProduct?.price || ""}
        onSuccess={handleSuccess}
      />
    </Layout>
  );
}
