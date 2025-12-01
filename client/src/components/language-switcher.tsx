import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Language } from "@/lib/translations";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex gap-2">
      <Button
        variant={language === "pl" ? "default" : "outline"}
        size="sm"
        onClick={() => setLanguage("pl")}
        className={language === "pl" ? "bg-primary text-black hover:bg-primary/90" : "border-primary/50 text-primary hover:bg-primary hover:text-black"}
      >
        PL
      </Button>
      <Button
        variant={language === "en" ? "default" : "outline"}
        size="sm"
        onClick={() => setLanguage("en")}
        className={language === "en" ? "bg-primary text-black hover:bg-primary/90" : "border-primary/50 text-primary hover:bg-primary hover:text-black"}
      >
        EN
      </Button>
    </div>
  );
}
