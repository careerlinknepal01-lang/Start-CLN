import { useEffect, useMemo, useRef, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import { UserAvatar } from "@/components/UserAvatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  name: string;
  avatar_url?: string | null;
  field?: string;
  college?: string;
}
interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

const Messages = () => {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const initialOther = params.get("u");
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(initialOther);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadError(null);
      try {
        const { data: conns, error } = await supabase
          .from("connections")
          .select("requester_id, addressee_id, status")
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
          .eq("status", "accepted");

        if (error) throw error;

        const ids = (conns || []).map((c) =>
          c.requester_id === user.id ? c.addressee_id : c.requester_id
        );

        if (initialOther && !ids.includes(initialOther)) {
          toast.error("You can only message accepted connections.");
          setParams({});
          setActiveId(null);
        } else if (initialOther && ids.includes(initialOther)) {
          setActiveId(initialOther);
        }

        if (ids.length === 0) {
          setContacts([]);
          setLoading(false);
          return;
        }

        const { data: profs, error: profError } = await supabase
          .from("profiles")
          .select("id, name, avatar_url, field, college")
          .in("id", ids);

        if (profError) throw profError;

        setContacts((profs as Profile[]) || []);
        if (!activeId && profs?.length) setActiveId(profs[0].id);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load conversations";
        setLoadError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, initialOther]);

  useEffect(() => {
    if (!user || !activeId) {
      setMessages([]);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${activeId}),and(sender_id.eq.${activeId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (error) {
        toast.error(error.message);
        return;
      }
      setMessages((data as Message[]) || []);
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("sender_id", activeId)
        .eq("receiver_id", user.id)
        .eq("read", false);
    })();
  }, [user, activeId]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("msg-" + user.id)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const m = payload.new as Message;
          const other = m.sender_id === user.id ? m.receiver_id : m.sender_id;
          if (other === activeId) {
            setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${user.id}`,
        },
        (payload) => {
          const m = payload.new as Message;
          if (m.receiver_id === activeId) {
            setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const activeContact = useMemo(() => contacts.find((c) => c.id === activeId), [contacts, activeId]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeId || !input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    const { data, error } = await supabase
      .from("messages")
      .insert({ sender_id: user.id, receiver_id: activeId, content })
      .select()
      .single();
    setSending(false);
    if (error) {
      toast.error(error.message);
      setInput(content);
      return;
    }
    if (data) setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data as Message]));
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="grid gap-4 md:grid-cols-[280px_1fr] md:h-[calc(100dvh-10rem)] animate-fade-in">
          {/* Contacts list skeleton */}
          <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border p-3">
              <div className="h-5 w-32 rounded bg-muted skeleton-shimmer" />
            </div>
            <div className="flex-1 p-2 space-y-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-muted skeleton-shimmer shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-28 rounded bg-muted skeleton-shimmer" />
                    <div className="h-3 w-20 rounded bg-muted skeleton-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Chat area skeleton */}
          <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted skeleton-shimmer" />
              <div className="space-y-1.5">
                <div className="h-4 w-32 rounded bg-muted skeleton-shimmer" />
                <div className="h-3 w-24 rounded bg-muted skeleton-shimmer" />
              </div>
            </div>
            <div className="flex-1 p-4 space-y-3">
              {[60, 80, 50, 70, 40].map((w, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                  <div
                    className="h-9 rounded-2xl bg-muted skeleton-shimmer"
                    style={{ width: `${w}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (loadError) {
    return (
      <AppLayout>
        <div className="border border-destructive/30 bg-destructive/5 p-6 text-center" style={{ borderRadius: "2px" }}>
          <p className="text-sm font-medium text-destructive">{loadError}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()} style={{ borderRadius: "2px" }}>
            Retry
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="grid min-h-[500px] gap-4 md:grid-cols-[280px_1fr] md:h-[calc(100dvh-10rem)]">
        <div className="flex flex-col border border-border bg-card" style={{ borderRadius: "0" }}>
          <div className="border-b border-border/50 px-4 py-3">
            <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/60">Conversations</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {contacts.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Connect with peers to start chatting.
              </div>
            )}
            {contacts.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setActiveId(c.id);
                  setParams({ u: c.id });
                }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                  activeId === c.id
                    ? "bg-primary/5 border-l-2 border-accent"
                    : "hover:bg-secondary border-l-2 border-transparent"
                }`}
              >
                <UserAvatar name={c.name} url={c.avatar_url} className="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{c.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{c.field}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col border border-border bg-card" style={{ borderRadius: "0" }}>
          {!activeContact ? (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-muted-foreground">
              <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm">Select a conversation to start chatting.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
                <UserAvatar name={activeContact.name} url={activeContact.avatar_url} className="h-9 w-9" />
                <div>
                  <div className="text-sm font-semibold">{activeContact.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {activeContact.field} &middot; {activeContact.college}
                  </div>
                </div>
              </div>
              <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-background p-4">
                {messages.length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">Say hi 👋</div>
                )}
                {messages.map((m) => {
                  const mine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] px-3.5 py-2 text-sm ${
                          mine
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                        style={{ borderRadius: mine ? "4px 4px 2px 4px" : "4px 4px 4px 2px" }}
                      >
                        <div className="whitespace-pre-wrap break-words">{m.content}</div>
                        <div
                          className={`mt-0.5 text-[10px] ${
                            mine ? "text-primary-foreground/60" : "text-muted-foreground"
                          }`}
                        >
                          {new Date(m.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={send} className="flex gap-2 border-t border-border/50 p-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Write a message…"
                  aria-label={`Message ${activeContact?.name ?? "contact"}`}
                  maxLength={2000}
                  disabled={sending}
                  style={{ borderRadius: "2px" }}
                />
                <Button type="submit" disabled={!input.trim() || sending} style={{ borderRadius: "2px" }} aria-label="Send message">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
      </AppLayout>
  );
};

export default Messages;
