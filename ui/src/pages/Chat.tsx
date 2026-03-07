import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box, Typography, TextField, IconButton, Paper, Chip, Divider,
  List, ListItemButton, ListItemText, Avatar,
  Tooltip, Collapse, alpha, Button, Switch, FormControlLabel, MenuItem, Slider,
  Link,
} from "@mui/material";
import SendIcon from "@mui/icons-material/SendRounded";
import SmartToyIcon from "@mui/icons-material/SmartToyRounded";
import PersonIcon from "@mui/icons-material/PersonRounded";
import MicIcon from "@mui/icons-material/MicRounded";
import StopIcon from "@mui/icons-material/StopRounded";
import VolumeUpIcon from "@mui/icons-material/VolumeUpRounded";
import ExpandMoreIcon from "@mui/icons-material/ExpandMoreRounded";
import InfoIcon from "@mui/icons-material/InfoOutlined";
import AddIcon from "@mui/icons-material/AddRounded";
import PublicIcon from "@mui/icons-material/PublicRounded";
import ImageIcon from "@mui/icons-material/ImageRounded";
import BuildIcon from "@mui/icons-material/BuildRounded";
import HistoryIcon from "@mui/icons-material/HistoryRounded";
import SearchIcon from "@mui/icons-material/SearchRounded";
import RefreshIcon from "@mui/icons-material/RefreshRounded";
import { useSnackbar } from "notistack";
import { api } from "../api";

type RolePreset = "default" | "analyst" | "engineer" | "pm" | "red_team" | "executive";
type ToolType = "web_search" | "image_to_text";

interface ToolInvocation {
  tool: ToolType;
  status: "success" | "error" | "skipped";
  latencyMs: number;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: { chunkId: string; score: number; source: string }[];
  rolePreset?: RolePreset;
  toolInvocations?: ToolInvocation[];
}

interface Thread {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
}

interface ToolAuditEntry {
  id: string;
  orgId: string;
  threadId: string;
  rolePreset: RolePreset;
  tool: ToolType;
  status: "success" | "error" | "skipped";
  latencyMs: number;
  message: string;
  createdAt: string;
  error?: string;
}

interface WebResultItem {
  title: string;
  snippet: string;
  url: string;
}

type SpeechRecognitionCtor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

const ROLE_PRESETS: Array<{ value: RolePreset; label: string }> = [
  { value: "default", label: "Default" },
  { value: "analyst", label: "Analyst" },
  { value: "engineer", label: "Engineer" },
  { value: "pm", label: "PM" },
  { value: "red_team", label: "Red Team" },
  { value: "executive", label: "Executive" },
];

const ROLE_ALLOWED_TOOLS: Record<RolePreset, ToolType[]> = {
  default: ["web_search", "image_to_text"],
  analyst: ["web_search", "image_to_text"],
  engineer: ["web_search", "image_to_text"],
  pm: ["web_search"],
  red_team: ["web_search", "image_to_text"],
  executive: ["web_search"],
};

const INITIAL_THREADS: Thread[] = [
  { id: "t1", title: "Tool-enabled assistant", preview: "Try role-play + web search + OCR", updatedAt: "just now" },
];

const INITIAL_MESSAGES: Message[] = [
  {
    role: "assistant",
    content: "I support stream responses, tool retries, web search, OCR, and voice controls. Configure tools on the right and send your prompt.",
    rolePreset: "default",
  },
];

const ORG_KEY = "bw_org_id";

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}

function toWebResults(output: Record<string, unknown>): WebResultItem[] {
  const raw = output.results;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => (isRecord(item)
      ? {
          title: typeof item.title === "string" ? item.title : "Result",
          snippet: typeof item.snippet === "string" ? item.snippet : "",
          url: typeof item.url === "string" ? item.url : "",
        }
      : null))
    .filter((i): i is WebResultItem => !!i);
}

function summarizeToolInput(inv: ToolInvocation) {
  return inv.tool === "web_search"
    ? `query: ${String(inv.input.query ?? "")}`
    : `image: ${String(inv.input.imageUrl ?? "")}`;
}

function invocationKey(inv: ToolInvocation) {
  return `${inv.tool}:${JSON.stringify(inv.input)}`;
}

export default function Chat() {
  const { enqueueSnackbar } = useSnackbar();

  const [threads] = useState(INITIAL_THREADS);
  const [activeThread, setActiveThread] = useState("t1");
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [contextOpen, setContextOpen] = useState(true);
  const [expandedCitation, setExpandedCitation] = useState<number | null>(null);

  const [rolePreset, setRolePreset] = useState<RolePreset>("default");
  const [webEnabled, setWebEnabled] = useState(true);
  const [webQuery, setWebQuery] = useState("latest Vertex AI retrieval best practices");
  const [ocrEnabled, setOcrEnabled] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [streamEnabled, setStreamEnabled] = useState(true);

  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");
  const [speechRate, setSpeechRate] = useState(1);

  const [toolAudit, setToolAudit] = useState<ToolAuditEntry[]>([]);
  const [auditSearch, setAuditSearch] = useState("");
  const [retryPendingKeys, setRetryPendingKeys] = useState<Set<string>>(new Set());
  const [lastCanceledPrompt, setLastCanceledPrompt] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);

  const orgId = localStorage.getItem(ORG_KEY) || "demo-org";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices();
      setVoices(list);
      if (!selectedVoiceURI && list[0]) setSelectedVoiceURI(list[0].voiceURI);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoiceURI]);

  const speak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) return;
    const utt = new SpeechSynthesisUtterance(text);
    const selected = voices.find((v) => v.voiceURI === selectedVoiceURI);
    if (selected) utt.voice = selected;
    utt.rate = speechRate;
    utt.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  };

  const startVoiceInput = () => {
    if (typeof window === "undefined") return;
    const win = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const Ctor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!Ctor) {
      enqueueSnackbar("Voice input not supported in this browser.", { variant: "warning" });
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      setInput((prev) => [prev, transcript].filter(Boolean).join(" ").trim());
    };
    recognition.onerror = (event) => {
      enqueueSnackbar(`Voice input error: ${event.error}`, { variant: "error" });
    };
    recognition.onend = () => {
      setIsListening(false);
      speechRef.current = null;
    };

    speechRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const stopVoiceInput = () => {
    speechRef.current?.stop();
    setIsListening(false);
  };

  const canUseWeb = ROLE_ALLOWED_TOOLS[rolePreset].includes("web_search");
  const canUseOcr = ROLE_ALLOWED_TOOLS[rolePreset].includes("image_to_text");

  useEffect(() => {
    if (!canUseWeb && webEnabled) setWebEnabled(false);
    if (!canUseOcr && ocrEnabled) setOcrEnabled(false);
  }, [canUseWeb, canUseOcr, webEnabled, ocrEnabled]);

  const latestTools = useMemo(
    () => [...messages].reverse().find((m) => m.toolInvocations?.length)?.toolInvocations ?? [],
    [messages],
  );

  const filteredAudit = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    if (!q) return toolAudit;
    return toolAudit.filter((entry) =>
      [entry.tool, entry.status, entry.message, entry.rolePreset, entry.threadId, entry.error ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [toolAudit, auditSearch]);

  const loadAudit = async () => {
    try {
      const res = await api.get<{ items: ToolAuditEntry[] }>(`/v1/chat/audit?orgId=${encodeURIComponent(orgId)}&limit=100`);
      setToolAudit(res.items ?? []);
    } catch {
      // Soft fail for local/dev without Firestore credentials.
      setToolAudit([]);
    }
  };

  useEffect(() => {
    void loadAudit();
  }, []);

  const appendLocalAudit = (invocations: ToolInvocation[]) => {
    const now = new Date().toISOString();
    const localEntries: ToolAuditEntry[] = invocations.map((inv, idx) => ({
      id: `${now}-${idx}-${Math.random().toString(36).slice(2, 8)}`,
      orgId,
      threadId: activeThread,
      rolePreset,
      tool: inv.tool,
      status: inv.status,
      latencyMs: inv.latencyMs,
      message: summarizeToolInput(inv),
      createdAt: now,
      error: inv.error,
    }));
    setToolAudit((prev) => [...localEntries, ...prev].slice(0, 100));
  };

  const retryTool = async (inv: ToolInvocation) => {
    const key = invocationKey(inv);
    setRetryPendingKeys((prev) => new Set(prev).add(key));
    try {
      const out = await api.post<{ invocation?: ToolInvocation }>("/v1/chat/tools/retry", {
        orgId,
        threadId: activeThread,
        rolePreset,
        tool: {
          type: inv.tool,
          enabled: true,
          input: inv.input,
        },
      });

      if (!out.invocation) {
        enqueueSnackbar("Retry returned no invocation.", { variant: "warning" });
        return;
      }

      appendLocalAudit([out.invocation]);
      enqueueSnackbar(`${inv.tool} retried (${out.invocation.status})`, {
        variant: out.invocation.status === "success" ? "success" : out.invocation.status === "error" ? "error" : "info",
      });
      void loadAudit();
    } catch {
      enqueueSnackbar("Tool retry failed.", { variant: "error" });
    } finally {
      setRetryPendingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const cancelStreaming = () => {
    if (!streamAbortRef.current) return;
    streamAbortRef.current.abort();
    streamAbortRef.current = null;
  };

  const addAssistantMessage = (assistant: Message) => {
    setMessages((prev) => [...prev, assistant]);
    appendLocalAudit(assistant.toolInvocations ?? []);
    if (autoSpeak) speak(assistant.content);
  };

  const sendStandard = async (msg: string) => {
    const res = await api.post<{
      threadId: string;
      response: {
        text: string;
        citations: { chunkId: string; score: number; source?: string; trace?: { sourceLabel?: string; assetId?: string } }[];
        rolePreset: RolePreset;
        toolInvocations: ToolInvocation[];
      };
    }>("/v1/chat", {
      threadId: activeThread,
      orgId,
      message: msg,
      rolePreset,
      tools: [
        { type: "web_search", enabled: webEnabled, input: { query: webQuery || msg } },
        { type: "image_to_text", enabled: ocrEnabled, input: { imageUrl } },
      ],
    });

    const citations = (res.response.citations ?? []).map((c) => ({
      chunkId: c.chunkId,
      score: c.score,
      source: c.source ?? c.trace?.sourceLabel ?? c.trace?.assetId ?? "source",
    }));

    addAssistantMessage({
      role: "assistant",
      content: res.response.text,
      citations,
      rolePreset: res.response.rolePreset,
      toolInvocations: res.response.toolInvocations ?? [],
    });
  };

  const sendStream = async (msg: string) => {
    const controller = new AbortController();
    streamAbortRef.current = controller;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = localStorage.getItem("bw_token");
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch("/v1/chat/stream", {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        threadId: activeThread,
        orgId,
        message: msg,
        rolePreset,
        tools: [
          { type: "web_search", enabled: webEnabled, input: { query: webQuery || msg } },
          { type: "image_to_text", enabled: ocrEnabled, input: { imageUrl } },
        ],
      }),
    });

    if (!res.ok || !res.body) throw new Error("Stream request failed");

    setMessages((prev) => [...prev, { role: "assistant", content: "", rolePreset, toolInvocations: [] }]);

    const decoder = new TextDecoder();
    const reader = res.body.getReader();
    let buffer = "";
    let finalTools: ToolInvocation[] = [];
    let streamText = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const evt = JSON.parse(line) as
            | { type: "meta"; toolInvocations?: ToolInvocation[] }
            | { type: "chunk"; text: string }
            | { type: "done"; response: { response: { rolePreset: RolePreset; toolInvocations: ToolInvocation[] } } };

          if (evt.type === "meta") {
            finalTools = evt.toolInvocations ?? [];
            setMessages((prev) => {
              const next = [...prev];
              const lastIdx = next.length - 1;
              if (lastIdx >= 0 && next[lastIdx]?.role === "assistant") next[lastIdx].toolInvocations = finalTools;
              return next;
            });
          }

          if (evt.type === "chunk") {
            streamText += evt.text;
            setMessages((prev) => {
              const next = [...prev];
              const lastIdx = next.length - 1;
              if (lastIdx >= 0 && next[lastIdx]?.role === "assistant") {
                next[lastIdx].content = `${next[lastIdx].content}${evt.text}`;
              }
              return next;
            });
          }

          if (evt.type === "done") {
            finalTools = evt.response.response.toolInvocations ?? finalTools;
            setMessages((prev) => {
              const next = [...prev];
              const lastIdx = next.length - 1;
              if (lastIdx >= 0 && next[lastIdx]?.role === "assistant") {
                next[lastIdx].rolePreset = evt.response.response.rolePreset;
                next[lastIdx].toolInvocations = finalTools;
              }
              return next;
            });
          }
        }
      }

      if (finalTools.length) appendLocalAudit(finalTools);
      if (autoSpeak && streamText) speak(streamText);
    } finally {
      streamAbortRef.current = null;
    }
  };

  const sendMessage = async () => {
    const msg = input.trim();
    if (!msg || sending) return;

    setSending(true);
    setLastCanceledPrompt(null);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);

    try {
      if (streamEnabled) {
        await sendStream(msg);
      } else {
        await sendStandard(msg);
      }
      void loadAudit();
    } catch (error) {
      const isAborted = error instanceof Error && error.name === "AbortError";
      if (isAborted) {
        setLastCanceledPrompt(msg);
        enqueueSnackbar("Streaming cancelled.", { variant: "info" });
        return;
      }

      enqueueSnackbar("Chat request failed. Check API and try again.", { variant: "error" });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I hit an error while processing that request. Please try again.", rolePreset },
      ]);
    } finally {
      setSending(false);
    }
  };

  const resumeCanceledStream = async () => {
    const msg = lastCanceledPrompt?.trim();
    if (!msg || sending) return;

    setSending(true);
    setLastCanceledPrompt(null);
    setMessages((prev) => [...prev, { role: "user", content: msg }]);

    try {
      if (streamEnabled) {
        await sendStream(msg);
      } else {
        await sendStandard(msg);
      }
      void loadAudit();
    } catch (error) {
      const isAborted = error instanceof Error && error.name === "AbortError";
      if (isAborted) {
        setLastCanceledPrompt(msg);
        enqueueSnackbar("Streaming cancelled.", { variant: "info" });
        return;
      }

      enqueueSnackbar("Chat request failed. Check API and try again.", { variant: "error" });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I hit an error while processing that request. Please try again.", rolePreset },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ display: "flex", height: "calc(100vh - 128px)", mx: -3, mt: -3 }}>
      <Box sx={{ width: 280, borderRight: 1, borderColor: "divider", display: "flex", flexDirection: "column" }}>
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle2">Threads</Typography>
          <IconButton size="small"><AddIcon fontSize="small" /></IconButton>
        </Box>
        <Divider />
        <List sx={{ flex: 1, overflow: "auto" }} disablePadding>
          {threads.map((t) => (
            <ListItemButton key={t.id} selected={activeThread === t.id} onClick={() => setActiveThread(t.id)} sx={{ py: 1.5 }}>
              <ListItemText
                primary={t.title}
                secondary={t.preview}
                primaryTypographyProps={{ variant: "body2", fontWeight: activeThread === t.id ? 600 : 400 }}
                secondaryTypographyProps={{ noWrap: true, variant: "caption" }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Box sx={{ px: 2.5, py: 1.25, borderBottom: 1, borderColor: "divider", display: "flex", gap: 1.25, alignItems: "center" }}>
          <Typography variant="caption" color="text.secondary">Role:</Typography>
          <TextField select size="small" value={rolePreset} onChange={(e) => setRolePreset(e.target.value as RolePreset)} sx={{ width: 170 }}>
            {ROLE_PRESETS.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
          </TextField>
          <Chip label={streamEnabled ? "STREAM ON" : "STREAM OFF"} size="small" color={streamEnabled ? "primary" : "default"} variant="outlined" />
          <Chip label={webEnabled ? "Web ON" : "Web OFF"} size="small" color={webEnabled ? "primary" : "default"} variant="outlined" />
          <Chip label={ocrEnabled ? "OCR ON" : "OCR OFF"} size="small" color={ocrEnabled ? "primary" : "default"} variant="outlined" />
          <Chip label={autoSpeak ? "TTS ON" : "TTS OFF"} size="small" color={autoSpeak ? "primary" : "default"} variant="outlined" />
          <Box sx={{ flex: 1 }} />
          {!contextOpen && (
            <Button size="small" variant="outlined" startIcon={<InfoIcon />} onClick={() => setContextOpen(true)}>
              Tools
            </Button>
          )}
          <Tooltip title={isListening ? "Stop voice input" : "Start voice input"}>
            <IconButton size="small" color={isListening ? "error" : "default"} onClick={isListening ? stopVoiceInput : startVoiceInput}>
              {isListening ? <StopIcon fontSize="small" /> : <MicIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
          {messages.map((m, i) => (
            <Box key={i} sx={{ display: "flex", gap: 1.5, mb: 3, maxWidth: 780, mx: m.role === "user" ? "auto" : undefined, ml: m.role === "user" ? "auto" : undefined }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: m.role === "assistant" ? alpha("#1A73E8", 0.15) : alpha("#5F6368", 0.15) }}>
                {m.role === "assistant" ? <SmartToyIcon sx={{ fontSize: 18, color: "#1A73E8" }} /> : <PersonIcon sx={{ fontSize: 18 }} />}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{m.content}</Typography>

                {!!m.rolePreset && m.role === "assistant" && (
                  <Box sx={{ mt: 1, display: "flex", gap: 0.75, alignItems: "center" }}>
                    <Chip label={`role: ${m.rolePreset}`} size="small" variant="outlined" />
                    <Tooltip title="Read response aloud">
                      <IconButton size="small" onClick={() => speak(m.content)}>
                        <VolumeUpIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}

                {!!m.toolInvocations?.length && (
                  <>
                    <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                      {m.toolInvocations.map((inv, idx) => {
                        const retrying = retryPendingKeys.has(invocationKey(inv));
                        return (
                          <Chip
                            key={`${inv.tool}-${idx}`}
                            icon={<BuildIcon sx={{ fontSize: 14 }} />}
                            size="small"
                            variant="outlined"
                            color={retrying ? "info" : inv.status === "success" ? "success" : inv.status === "error" ? "error" : "default"}
                            onDelete={retrying ? undefined : () => void retryTool(inv)}
                            deleteIcon={<RefreshIcon sx={{ fontSize: 14 }} />}
                            label={retrying ? `${inv.tool} · retrying…` : `${inv.tool} · ${inv.status} · ${inv.latencyMs}ms`}
                          />
                        );
                      })}
                    </Box>

                    {m.toolInvocations
                      .filter((inv) => inv.tool === "web_search" && inv.status === "success")
                      .map((inv, idx) => {
                        const results = toWebResults(inv.output);
                        if (!results.length) return null;
                        return (
                          <Box key={`web-results-${idx}`} sx={{ mt: 1, display: "grid", gap: 0.75 }}>
                            {results.map((r, ri) => (
                              <Paper key={`${r.url}-${ri}`} variant="outlined" sx={{ p: 1.2 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>{r.title}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.4 }}>{r.snippet}</Typography>
                                {r.url && (
                                  <Link href={r.url} target="_blank" rel="noreferrer" underline="hover" sx={{ fontSize: "0.72rem" }}>
                                    {r.url}
                                  </Link>
                                )}
                              </Paper>
                            ))}
                          </Box>
                        );
                      })}
                  </>
                )}

                {m.citations && m.citations.length > 0 && (
                  <Box sx={{ mt: 1.5 }}>
                    <Chip
                      label={`${m.citations.length} citations`}
                      size="small"
                      variant="outlined"
                      onClick={() => setExpandedCitation(expandedCitation === i ? null : i)}
                      icon={<ExpandMoreIcon sx={{ transform: expandedCitation === i ? "rotate(180deg)" : undefined, transition: "0.2s" }} />}
                    />
                    <Collapse in={expandedCitation === i}>
                      <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
                        {m.citations.map((c, ci) => (
                          <Paper key={ci} variant="outlined" sx={{ p: 1, display: "flex", gap: 1, alignItems: "center" }}>
                            <Typography variant="caption" sx={{ fontFamily: "'Roboto Mono', monospace" }}>{c.chunkId}</Typography>
                            <Chip label={`${(c.score * 100).toFixed(0)}%`} size="small" color="primary" variant="outlined" />
                            <Typography variant="caption" color="text.secondary">from {c.source}</Typography>
                          </Paper>
                        ))}
                      </Box>
                    </Collapse>
                  </Box>
                )}
              </Box>
            </Box>
          ))}
          <div ref={endRef} />
        </Box>

        <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          {!!lastCanceledPrompt && !sending && (
            <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
              <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={() => void resumeCanceledStream()}>
                Resume stream
              </Button>
            </Box>
          )}
          <Box sx={{ display: "flex", gap: 1, maxWidth: 780, mx: "auto" }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Ask, research, role-play, stream, or extract text from image URL…"
              value={input}
              disabled={sending}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              multiline
              maxRows={4}
            />
            {sending && streamEnabled && (
              <Tooltip title="Stop streaming response">
                <IconButton color="warning" onClick={cancelStreaming}>
                  <StopIcon />
                </IconButton>
              </Tooltip>
            )}
            <IconButton color="primary" disabled={!input.trim() || sending} onClick={() => void sendMessage()}>
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {contextOpen && (
        <Box sx={{ width: 370, borderLeft: 1, borderColor: "divider", overflow: "auto", p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="subtitle2">Tools</Typography>
            <IconButton size="small" onClick={() => setContextOpen(false)}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Box>

          <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Response Mode</Typography>
            <FormControlLabel
              control={<Switch checked={streamEnabled} onChange={(e) => setStreamEnabled(e.target.checked)} size="small" />}
              label={<Typography variant="caption">Stream response chunks</Typography>}
            />
          </Paper>

          <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <PublicIcon sx={{ fontSize: 18 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Web Search</Typography>
            </Box>
            <FormControlLabel
              control={<Switch checked={webEnabled} onChange={(e) => setWebEnabled(e.target.checked)} size="small" disabled={!canUseWeb} />}
              label={<Typography variant="caption">Enable web grounding</Typography>}
            />
            {!canUseWeb && <Typography variant="caption" color="text.secondary">This role cannot use web search.</Typography>}
            <TextField size="small" fullWidth disabled={!webEnabled || !canUseWeb} label="Search query" value={webQuery} onChange={(e) => setWebQuery(e.target.value)} sx={{ mt: 1 }} />
          </Paper>

          <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <ImageIcon sx={{ fontSize: 18 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Image to Text</Typography>
            </Box>
            <FormControlLabel
              control={<Switch checked={ocrEnabled} onChange={(e) => setOcrEnabled(e.target.checked)} size="small" disabled={!canUseOcr} />}
              label={<Typography variant="caption">Enable OCR tool</Typography>}
            />
            {!canUseOcr && <Typography variant="caption" color="text.secondary">This role cannot use image-to-text.</Typography>}
            <TextField size="small" fullWidth disabled={!ocrEnabled || !canUseOcr} label="Image URL" placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} sx={{ mt: 1 }} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              Starter mode returns mocked OCR unless Vision OCR is enabled on API.
            </Typography>
          </Paper>

          <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Voice</Typography>
            <FormControlLabel
              control={<Switch checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} size="small" />}
              label={<Typography variant="caption">Auto-read assistant responses (TTS)</Typography>}
            />
            <TextField select size="small" fullWidth label="Voice" value={selectedVoiceURI} onChange={(e) => setSelectedVoiceURI(e.target.value)} sx={{ mt: 1 }}>
              {voices.map((v) => <MenuItem key={v.voiceURI} value={v.voiceURI}>{`${v.name} (${v.lang})`}</MenuItem>)}
            </TextField>
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Speed: {speechRate.toFixed(1)}x</Typography>
              <Slider value={speechRate} min={0.6} max={1.6} step={0.1} onChange={(_, v) => setSpeechRate(v as number)} size="small" />
            </Box>
          </Paper>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="overline" color="text.secondary">Last Tool Run</Typography>
          <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
            {latestTools.length === 0 ? (
              <Typography variant="caption" color="text.secondary">No tool activity yet.</Typography>
            ) : latestTools.map((inv, idx) => (
              <Paper key={`${inv.tool}-${idx}`} variant="outlined" sx={{ p: 1.25 }}>
                {retryPendingKeys.has(invocationKey(inv)) && (
                  <Chip size="small" label="retrying…" color="info" variant="outlined" sx={{ mb: 0.75 }} />
                )}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>{inv.tool}</Typography>
                  <Chip size="small" label={inv.status} color={inv.status === "success" ? "success" : inv.status === "error" ? "error" : "default"} variant="outlined" />
                </Box>
                <Typography variant="caption" color="text.secondary">{inv.latencyMs}ms</Typography>
                {inv.error && <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>{inv.error}</Typography>}
                <Button
                  size="small"
                  variant="text"
                  startIcon={<RefreshIcon />}
                  onClick={() => void retryTool(inv)}
                  disabled={retryPendingKeys.has(invocationKey(inv))}
                  sx={{ mt: 0.5 }}
                >
                  Retry
                </Button>
              </Paper>
            ))}
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <HistoryIcon sx={{ fontSize: 18 }} />
            <Typography variant="subtitle2">Tool Audit Log</Typography>
            <Box sx={{ flex: 1 }} />
            <IconButton size="small" onClick={() => void loadAudit()}>
              <RefreshIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          <TextField
            size="small"
            fullWidth
            placeholder="Search audit entries..."
            value={auditSearch}
            onChange={(e) => setAuditSearch(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, mr: 1, color: "text.secondary" }} /> }}
            sx={{ mb: 1 }}
          />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, maxHeight: 240, overflow: "auto" }}>
            {filteredAudit.length === 0 ? (
              <Typography variant="caption" color="text.secondary">No matching audit entries.</Typography>
            ) : filteredAudit.slice(0, 40).map((entry) => (
              <Paper key={entry.id} variant="outlined" sx={{ p: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>{entry.tool}</Typography>
                  <Chip size="small" label={entry.status} variant="outlined" color={entry.status === "success" ? "success" : entry.status === "error" ? "error" : "default"} />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{entry.message}</Typography>
                <Typography variant="caption" color="text.secondary">{new Date(entry.createdAt).toLocaleString()} · {entry.latencyMs}ms · {entry.rolePreset}</Typography>
              </Paper>
            ))}
          </Box>

          <Box sx={{ mt: 2 }}>
            <Tooltip title="Tip: use stream mode for faster perceived response while tools run in parallel.">
              <Button fullWidth size="small" variant="outlined">Best-Result Hint</Button>
            </Tooltip>
          </Box>
        </Box>
      )}
    </Box>
  );
}
