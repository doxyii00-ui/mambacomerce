import { Layout } from "@/components/layout";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Send, FileText, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [purchases, setPurchases] = useState<string[]>([]);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

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
              <CardTitle className="text-2xl font-display">No Active Services</CardTitle>
              <CardDescription>
                You haven't purchased any Mamba services yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-primary text-black hover:bg-primary/90"
                onClick={() => setLocation("/")}
              >
                Browse Products
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
        <h1 className="text-3xl font-display font-bold text-white mb-8">SERVICE DASHBOARD</h1>

        <Tabs defaultValue={purchases[0]} className="w-full max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-900/50 border border-white/5 p-1">
            <TabsTrigger 
              value="obywatel" 
              disabled={!purchases.includes("obywatel")}
              className="data-[state=active]:bg-primary data-[state=active]:text-black font-mono uppercase"
            >
              Mamba Obywatel
              {!purchases.includes("obywatel") && <Lock className="ml-2 h-3 w-3" />}
            </TabsTrigger>
            <TabsTrigger 
              value="receipts" 
              disabled={!purchases.includes("receipts")}
              className="data-[state=active]:bg-secondary data-[state=active]:text-white font-mono uppercase"
            >
              Mamba Receipts
              {!purchases.includes("receipts") && <Lock className="ml-2 h-3 w-3" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="obywatel">
            <MambaObywatelForm />
          </TabsContent>

          <TabsContent value="receipts">
            <MambaReceiptsForm />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function MambaObywatelForm() {
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Request Sent",
      description: "Your data has been securely transmitted for processing.",
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
            <CardTitle className="font-display text-primary">Citizen Data Generator</CardTitle>
            <CardDescription>Fill in the details to generate your identity package.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input className="bg-black/40 border-white/10" placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input type="date" className="bg-black/40 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>PESEL / ID Number</Label>
              <Input className="bg-black/40 border-white/10" placeholder="00000000000" />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input className="bg-black/40 border-white/10" placeholder="Warsaw" />
            </div>
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full bg-primary text-black hover:bg-primary/90 font-bold">
              <Send className="mr-2 h-4 w-4" /> Generate Identity
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function MambaReceiptsForm() {
  const { toast } = useToast();
  const [discordVerified, setDiscordVerified] = useState(false);
  const [username, setUsername] = useState("");

  const handleVerify = () => {
    if (username.length > 2) {
      setDiscordVerified(true);
      toast({
        title: "Verified",
        description: "Discord account linked successfully.",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Receipt Generated",
      description: "Check your Discord DM for the download link.",
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
              <CardTitle className="font-display text-secondary">Discord Verification Required</CardTitle>
              <CardDescription>Please enter your Discord username to access the receipt generator.</CardDescription>
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
              Verify
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
            <CardTitle className="font-display text-secondary">Receipt Generator</CardTitle>
            <CardDescription>Create valid receipt formats instantly.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Store Name</Label>
              <Input className="bg-black/40 border-white/10" placeholder="Store Name Inc." />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="datetime-local" className="bg-black/40 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Total Amount</Label>
              <Input className="bg-black/40 border-white/10" placeholder="$0.00" />
            </div>
            <div className="space-y-2">
              <Label>Items (Comma separated)</Label>
              <Input className="bg-black/40 border-white/10" placeholder="Item 1, Item 2, Item 3" />
            </div>
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full bg-secondary text-white hover:bg-secondary/90 font-bold">
              <Send className="mr-2 h-4 w-4" /> Generate Receipt
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
