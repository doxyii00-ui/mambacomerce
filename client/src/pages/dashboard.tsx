import { Layout } from "@/components/layout";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Send, FileText, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/translations";

export default function Dashboard() {
  const [purchases, setPurchases] = useState<string[]>([]);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("mamba_purchases") || "[]");
    setPurchases(stored);
  }, []);

  if (purchases.length === 0) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <Card className="w-full max-w-md bg-zinc-900/50 border-zinc-800">
            <CardHeader className="text-center">
              <Lock className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
              <CardTitle className="text-2xl font-display">{t.dashboard.noServices}</CardTitle>
              <CardDescription>
                {t.dashboard.noServicesDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-primary text-black hover:bg-primary/90"
                onClick={() => setLocation("/")}
              >
                {t.dashboard.browseProducts}
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-display font-bold text-white mb-8">{t.dashboard.title}</h1>

        <Tabs defaultValue={purchases[0]} className="w-full max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-900/50 border border-white/5 p-1">
            <TabsTrigger 
              value="obywatel-app" 
              disabled={!purchases.includes("obywatel-app")}
              className="data-[state=active]:bg-primary data-[state=active]:text-black font-mono uppercase"
            >
              Mamba Obywatel {!purchases.includes("obywatel-app") && <Lock className="ml-2 h-3 w-3" />}
            </TabsTrigger>
            <TabsTrigger 
              value="receipts-month" 
              disabled={!purchases.includes("receipts-month") && !purchases.includes("receipts-year")}
              className="data-[state=active]:bg-secondary data-[state=active]:text-white font-mono uppercase"
            >
              Mamba Receipts {!purchases.includes("receipts-month") && !purchases.includes("receipts-year") && <Lock className="ml-2 h-3 w-3" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="obywatel-app">
            {purchases.includes("obywatel-app") && <MambaObywatelForm t={t} />}
          </TabsContent>

          <TabsContent value="receipts-month">
            {(purchases.includes("receipts-month") || purchases.includes("receipts-year")) && <MambaReceiptsForm t={t} />}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function MambaObywatelForm({ t }: { t: typeof translations.pl }) {
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Żądanie wysłane",
      description: "Twoje dane zostały bezpiecznie przesłane do przetworzenia.",
      duration: 3000,
    });
  };

  return (
    <Card className="mt-6 bg-zinc-900/50 border-primary/20 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="font-display text-primary">{t.dashboard.obywatelForm.title}</CardTitle>
            <CardDescription>{t.dashboard.obywatelForm.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>{t.dashboard.obywatelForm.fullName}</Label>
              <Input className="bg-black/40 border-white/10" placeholder="Jan Kowalski" />
            </div>
            <div className="space-y-2">
              <Label>{t.dashboard.obywatelForm.dateOfBirth}</Label>
              <Input type="date" className="bg-black/40 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>{t.dashboard.obywatelForm.peselnumber}</Label>
              <Input className="bg-black/40 border-white/10" placeholder="00000000000" />
            </div>
            <div className="space-y-2">
              <Label>{t.dashboard.obywatelForm.city}</Label>
              <Input className="bg-black/40 border-white/10" placeholder="Warszawa" />
            </div>
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full bg-primary text-black hover:bg-primary/90 font-bold">
              <Send className="mr-2 h-4 w-4" /> {t.dashboard.obywatelForm.generate}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function MambaReceiptsForm({ t }: { t: typeof translations.pl }) {
  const { toast } = useToast();
  const [discordVerified, setDiscordVerified] = useState(false);
  const [username, setUsername] = useState("");

  const handleVerify = () => {
    if (username.length > 2) {
      setDiscordVerified(true);
      toast({
        title: "Zweryfikowano",
        description: "Konto Discord zostało pomyślnie połączone.",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Paragon wygenerowany",
      description: "Sprawdź wiadomości na Discordzie, aby pobrać link.",
    });
  };

  if (!discordVerified) {
    return (
      <Card className="mt-6 bg-zinc-900/50 border-secondary/20 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <Lock className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <CardTitle className="font-display text-secondary">{t.dashboard.receiptsForm.verificationRequired}</CardTitle>
              <CardDescription>{t.dashboard.receiptsForm.verificationDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 max-w-md">
            <Input 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username#0000" 
              className="bg-black/40 border-white/10" 
            />
            <Button onClick={handleVerify} className="bg-secondary hover:bg-secondary/90 text-white">
              {t.dashboard.receiptsForm.verify}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6 bg-zinc-900/50 border-secondary/20 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary/10">
            <FileText className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <CardTitle className="font-display text-secondary">{t.dashboard.receiptsForm.title}</CardTitle>
            <CardDescription>{t.dashboard.receiptsForm.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>{t.dashboard.receiptsForm.storeName}</Label>
              <Input className="bg-black/40 border-white/10" placeholder="Nazwa sklepu" />
            </div>
            <div className="space-y-2">
              <Label>{t.dashboard.receiptsForm.date}</Label>
              <Input type="datetime-local" className="bg-black/40 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>{t.dashboard.receiptsForm.totalAmount}</Label>
              <Input className="bg-black/40 border-white/10" placeholder="100 zł" />
            </div>
            <div className="space-y-2">
              <Label>{t.dashboard.receiptsForm.items}</Label>
              <Input className="bg-black/40 border-white/10" placeholder="Towar 1, Towar 2, Towar 3" />
            </div>
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full bg-secondary text-white hover:bg-secondary/90 font-bold">
              <Send className="mr-2 h-4 w-4" /> {t.dashboard.receiptsForm.generate}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
