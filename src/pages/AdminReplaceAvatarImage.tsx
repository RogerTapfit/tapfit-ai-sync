import { useState } from "react";
import SEO from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function AdminReplaceAvatarImage() {
  const [sourceUrl, setSourceUrl] = useState("");
  const [destPath, setDestPath] = useState("avatars/nova-hawk.png");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl) {
      toast({ title: "Source URL required", description: "Please paste the URL to the new image." });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("replaceAvatarImage", {
        body: { sourceUrl, destPath },
      });
      if (error) throw error;
      toast({
        title: "Image replaced",
        description: `Uploaded to ${data?.path}. If cached, hard refresh to see changes.`,
      });
    } catch (err: any) {
      toast({ title: "Failed to replace image", description: err?.message || "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <SEO
        title="Replace Avatar Image | TapFit Admin"
        description="Admin tool to overwrite an avatar image in storage."
        canonicalPath="/admin/replace-avatar-image"
      />
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Replace Avatar Image</h1>
        <p className="text-sm opacity-80">Admin-only tool to overwrite an image in the character-images bucket.</p>
      </header>
      <section>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sourceUrl">Source image URL</Label>
            <Input
              id="sourceUrl"
              placeholder="https://... or /lovable-uploads/your-image.png"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="destPath">Destination path in bucket</Label>
            <Input
              id="destPath"
              placeholder="avatars/nova-hawk.png"
              value={destPath}
              onChange={(e) => setDestPath(e.target.value)}
            />
            <p className="text-xs opacity-70">Bucket: character-images. Must start with "avatars/". Existing file will be overwritten.</p>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Replacing..." : "Replace Image"}
          </Button>
        </form>
      </section>
    </main>
  );
}
