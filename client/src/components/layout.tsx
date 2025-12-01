import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { DiscordModal } from "@/components/discord-modal";
import { HelpModal } from "@/components/help-modal";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/translations";
import logo from "@assets/generated_images/futuristic_glowing_green_mamba_snake_logo.png";

export function Layout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [discordModalOpen, setDiscordModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];

  const NavContent = () => (
    <>
      <Link href="/" className="text-foreground/80 hover:text-primary transition-colors font-display tracking-wider cursor-pointer">
        {t.nav.home}
      </Link>
      <Link href="/dashboard" className="text-foreground/80 hover:text-primary transition-colors font-display tracking-wider cursor-pointer">
        {t.nav.dashboard}
      </Link>
      <button 
        onClick={() => setDiscordModalOpen(true)}
        className="text-foreground/80 hover:text-secondary transition-colors font-display tracking-wider cursor-pointer"
      >
        {t.nav.discord}
      </button>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <img 
              src={logo} 
              alt="Mamba Logo" 
              className="h-10 w-10 object-contain drop-shadow-[0_0_5px_hsl(142_70%_50%_/_0.5)] transition-transform group-hover:scale-110" 
            />
            <span className="text-xl font-bold font-display tracking-widest text-white group-hover:text-primary transition-colors text-glow">
              MAMBA
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <NavContent />
            <LanguageSwitcher />
            <Link href="/auth">
              <Button 
                variant="outline" 
                className="border-primary/50 text-primary hover:bg-primary hover:text-black font-mono text-xs uppercase tracking-widest cursor-pointer"
              >
                {t.nav.login}
              </Button>
            </Link>
          </nav>

          {/* Mobile Nav */}
          <div className="flex md:hidden gap-2">
            <LanguageSwitcher />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-card/95 backdrop-blur-xl border-l border-white/10">
                <div className="flex flex-col gap-6 mt-10">
                  <NavContent />
                  <Link href="/auth" onClick={() => setIsOpen(false)}>
                    <Button className="w-full bg-primary text-black hover:bg-primary/90 font-mono text-xs uppercase tracking-widest">
                      {t.nav.login}
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/40 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 opacity-70">
            <img src={logo} alt="Mamba" className="h-6 w-6 grayscale" />
            <span className="font-mono text-xs text-muted-foreground">{t.footer.copyright}</span>
          </div>
          <div className="flex gap-6 text-xs font-mono text-muted-foreground">
            <Link href="/terms" className="hover:text-primary transition-colors cursor-pointer">
              {t.footer.terms}
            </Link>
            <Link href="/privacy" className="hover:text-primary transition-colors cursor-pointer">
              {t.footer.privacy}
            </Link>
            <button 
              onClick={() => setHelpModalOpen(true)}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              {t.footer.support}
            </button>
          </div>
        </div>
      </footer>

      <DiscordModal open={discordModalOpen} onOpenChange={setDiscordModalOpen} />
      <HelpModal open={helpModalOpen} onOpenChange={setHelpModalOpen} />
    </div>
  );
}
