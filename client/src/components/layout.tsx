import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { DiscordModal } from "@/components/discord-modal";
import { HelpModal } from "@/components/help-modal";
import { AccountMenu } from "@/components/account-menu";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/translations";
import logo from "@assets/generated_images/futuristic_glowing_green_mamba_snake_logo.png";

import { Helmet } from "react-helmet";

export function Layout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [discordModalOpen, setDiscordModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    const email = localStorage.getItem("mamba_user_email");
    setIsLoggedIn(!!email);
  }, []);

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
      
      {/* META SEO */}
      <Helmet>
        <title>Mamba – fObywatel, Receipts Discord, Generatory</title>
        <meta
          name="description"
          content="Mamba oferuje fObywatel, generatory cyfrowych ID, receipts Discord oraz narzędzia automatyzacji. Najlepszy zestaw narzędzi dla Discord."
        />
        <meta
          name="keywords"
          content="fobywatel, f obywatel, receipts discord, discord receipts, mamba tools, generatory discord, obywatel app"
        />
        <meta property="og:title" content="Mamba – fObywatel & Receipts Discord" />
        <meta
          property="og:description"
          content="Generatory dokumentów, fObywatel, receipts Discord i narzędzia cyfrowe."
        />
        <meta name="robots" content="index, follow" />
      </Helmet>

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
