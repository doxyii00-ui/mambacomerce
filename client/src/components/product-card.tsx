import { motion } from "framer-motion";
import { Check, ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ProductCardProps {
  title: string;
  price: string;
  description: string;
  image?: string;
  video?: string;
  features: string[];
  accentColor?: "primary" | "secondary";
  onBuy: () => void;
  discordLink?: string;
}

export function ProductCard({ 
  title, 
  price, 
  description, 
  image,
  video,
  features, 
  accentColor = "primary",
  onBuy,
  discordLink
}: ProductCardProps) {
  const colorClass = accentColor === "primary" ? "text-primary" : "text-secondary";
  const borderClass = accentColor === "primary" ? "border-primary/20 group-hover:border-primary/50" : "border-secondary/20 group-hover:border-secondary/50";
  const buttonClass = accentColor === "primary" 
    ? "bg-primary text-black hover:bg-primary/90" 
    : "bg-secondary text-white hover:bg-secondary/90";

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="h-full"
    >
      <Card className={`h-full flex flex-col overflow-hidden bg-card/40 backdrop-blur-md border ${borderClass} transition-colors group`}>
        <CardHeader>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <CardTitle className={`font-display text-2xl tracking-wide ${colorClass} text-glow`}>
                {title}
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                {description}
              </CardDescription>
            </div>
            <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 whitespace-nowrap ml-4">
              <span className={`font-mono font-bold ${colorClass}`}>{price}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-6">
          <div>
            <h3 className="text-sm font-display font-bold text-white mb-3 uppercase tracking-wider">Funkcje</h3>
            <ul className="space-y-3">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                  <div className={`rounded-full p-1 bg-white/5 ${colorClass}`}>
                    <Check className="h-3 w-3" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {(video || image) && (
            <div>
              <h3 className="text-sm font-display font-bold text-white mb-3 uppercase tracking-wider">Podgląd</h3>
              <div className="min-h-56 lg:h-56 overflow-hidden relative rounded-lg border border-white/10">
                <div className={`absolute inset-0 bg-gradient-to-t from-background to-transparent z-10`} />
                {video ? (
                  <video 
                    src={video} 
                    autoPlay 
                    muted 
                    loop 
                    className="w-full h-full object-contain transition-transform duration-500 hover:scale-105" 
                  />
                ) : (
                  <img 
                    src={image} 
                    alt={title} 
                    className="w-full h-full object-contain transition-transform duration-500 hover:scale-105" 
                  />
                )}
              </div>
            </div>
          )}

          {discordLink && (
            <div className="bg-gradient-to-r from-[#5865F2]/10 to-[#5865F2]/5 border border-[#5865F2]/30 rounded-lg p-4">
              <h3 className="text-sm font-display font-bold text-white mb-2 flex items-center gap-2 uppercase tracking-wider">
                <MessageCircle className="h-4 w-4 text-[#5865F2]" />
                Społeczność Discord
              </h3>
              <p className="text-xs text-gray-400 mb-3">Dołącz do naszej społeczności, aby uzyskać wsparcie i dzielić się doświadczeniami z innymi użytkownikami.</p>
              <a 
                href={discordLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#5865F2] hover:text-white transition-colors text-sm font-mono font-bold"
              >
                Dołącz do Discorda <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button 
            className={`w-full font-mono font-bold tracking-wider uppercase ${buttonClass}`}
            onClick={onBuy}
          >
            Purchase Access <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
