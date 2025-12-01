import { Layout } from "@/components/layout";
import { ProductCard } from "@/components/product-card";
import { CheckoutDialog } from "@/components/checkout-dialog";
import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import mambaLogo from "@assets/generated_images/futuristic_glowing_green_mamba_snake_logo.png";
import obywatelBg from "@assets/generated_images/cyberpunk_digital_id_card_abstract_background.png";
import receiptsBg from "@assets/generated_images/cyberpunk_digital_receipt_abstract_background.png";
import heroBg from "@assets/generated_images/dark_cyberpunk_digital_grid_hero_background.png";
import obywatelVideo from "@assets/copy_E3111A92-34FD-401C-9AE1-8359E1F1F619_1764588726011.mov";
import receiptsVideo from "@assets/3B567DDC-82D5-429F-B36F-3192BF8842C3_1764590038254.mov";

type ProductId = "obywatel-app" | "obywatel-pro" | "receipts-month" | "receipts-year";

export default function Home() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProductView, setSelectedProductView] = useState<ProductId | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<{ name: string; price: string; id: string } | null>(null);
  const [_, setLocation] = useLocation();
  const { language } = useLanguage();
  const t = translations[language];

  const products = [
    {
      id: "obywatel-app" as ProductId,
      title: t.products.obywatelApp.title,
      price: t.products.obywatelApp.price,
      description: t.products.obywatelApp.description,
      features: t.products.obywatelApp.features,
      accentColor: "primary" as const,
      name: "MambaObywatel (App)",
      discordLink: "https://discord.gg/obywatel"
    },
    {
      id: "obywatel-pro" as ProductId,
      title: t.products.obywatelPro.title,
      price: t.products.obywatelPro.price,
      description: t.products.obywatelPro.description,
      features: t.products.obywatelPro.features,
      accentColor: "primary" as const,
      name: "MambaObywatel PRO",
      discordLink: "https://discord.gg/obywatel"
    },
    {
      id: "receipts-month" as ProductId,
      title: t.products.receiptsMonth.title,
      price: t.products.receiptsMonth.price,
      description: t.products.receiptsMonth.description,
      video: receiptsVideo,
      features: t.products.receiptsMonth.features,
      accentColor: "secondary" as const,
      name: "MambaReceipts (Monthly)",
      discordLink: "https://discord.gg/receipts"
    },
    {
      id: "receipts-year" as ProductId,
      title: t.products.receiptsYear.title,
      price: t.products.receiptsYear.price,
      description: t.products.receiptsYear.description,
      video: receiptsVideo,
      features: t.products.receiptsYear.features,
      accentColor: "secondary" as const,
      name: "MambaReceipts (Annual)",
      discordLink: "https://discord.gg/receipts"
    }
  ];

  const handleBuy = (product: { name: string; price: string; id: string }) => {
    setSelectedProduct(product);
    setCheckoutOpen(true);
  };

  const handleSuccess = () => {
    if (selectedProduct) {
      const purchases = JSON.parse(localStorage.getItem("mamba_purchases") || "[]");
      if (!purchases.includes(selectedProduct.id)) {
        purchases.push(selectedProduct.id);
        localStorage.setItem("mamba_purchases", JSON.stringify(purchases));
      }
      setLocation("/dashboard");
    }
  };

  const selectedProductData = selectedProductView ? products.find(p => p.id === selectedProductView) : null;

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
              {t.hero.title} <br />
              <span className="text-primary text-glow">{t.hero.titleHighlight}</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-light">
              {t.hero.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 bg-black/20 backdrop-blur-sm relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">{t.products.title}</h2>
            <div className="h-1 w-20 bg-primary mx-auto rounded-full shadow-[0_0_10px_hsl(142_70%_50%)]" />
          </div>

          {!selectedProductView ? (
            // Products List
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {products.map((product) => (
                <motion.button
                  key={product.id}
                  onClick={() => setSelectedProductView(product.id)}
                  whileHover={{ y: -5 }}
                  className="p-6 rounded-lg bg-gradient-to-br border transition-all"
                  style={
                    product.accentColor === "primary"
                      ? {
                          backgroundImage: "linear-gradient(to bottom right, rgba(142, 179, 79, 0.1), rgba(142, 179, 79, 0.05))",
                          borderColor: "rgba(142, 179, 79, 0.3)"
                        }
                      : {
                          backgroundImage: "linear-gradient(to bottom right, rgba(168, 85, 247, 0.1), rgba(168, 85, 247, 0.05))",
                          borderColor: "rgba(168, 85, 247, 0.3)"
                        }
                  }
                >
                  <h3 className={`text-lg font-display font-bold mb-2 ${
                    product.accentColor === "primary" ? "text-primary" : "text-secondary"
                  }`}>
                    {product.title}
                  </h3>
                  <p className="text-xl font-mono font-bold mb-3" style={{
                    color: product.accentColor === "primary" ? "hsl(142 70% 50%)" : "hsl(267 80% 50%)"
                  }}>
                    {product.price}
                  </p>
                  <p className="text-sm text-zinc-400 line-clamp-2">
                    {product.description}
                  </p>
                </motion.button>
              ))}
            </motion.div>
          ) : (
            // Selected Product Detail
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-4xl mx-auto"
            >
              <Button
                onClick={() => setSelectedProductView(null)}
                variant="ghost"
                className="mb-8 text-primary hover:text-primary/80 font-display"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Wróć do listy
              </Button>

              {selectedProductData && (
                <ProductCard
                  title={selectedProductData.title}
                  price={selectedProductData.price}
                  description={selectedProductData.description}
                  video={selectedProductData.video}
                  image={selectedProductData.image}
                  features={selectedProductData.features}
                  accentColor={selectedProductData.accentColor}
                  discordLink={selectedProductData.discordLink}
                  onBuy={() => handleBuy({
                    name: selectedProductData.name,
                    price: selectedProductData.price,
                    id: selectedProductData.id
                  })}
                />
              )}
            </motion.div>
          )}
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
