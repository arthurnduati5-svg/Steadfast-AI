export class SpeechToText {
  private recognition: any = null;
  private isListening = false;
  private sessionToken = 0;

  constructor() {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = "en-US";
      }
    }
  }

  isSupported(): boolean {
    return !!this.recognition;
  }

  start(
    onPartial: (text: string) => void,
    onFinal: (text: string) => void,
    onError: (error: any) => void
  ): void {
    if (!this.recognition) {
      onError("Speech recognition not supported");
      return;
    }

    if (this.isListening) return;

    // New session token: any old callbacks become no-ops
    const myToken = ++this.sessionToken;

    this.recognition.onresult = (event: any) => {
      if (myToken !== this.sessionToken) return;

      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const text = event.results[i][0]?.transcript ?? "";
        if (event.results[i].isFinal) finalTranscript += text;
        else interimTranscript += text;
      }

      // Normalize whitespace a bit
      const finalClean = finalTranscript.trim();
      const interimClean = interimTranscript.trim();

      if (finalClean) onFinal(finalClean);
      if (interimClean) onPartial(interimClean);
    };

    this.recognition.onerror = (event: any) => {
      if (myToken !== this.sessionToken) return;

      const err = event?.error;
      console.error("[STT] error:", err);

      // Ignore common benign errors
      if (err === "no-speech" || err === "aborted") return;

      onError(err || "speech-error");
    };

    this.recognition.onend = () => {
      if (myToken !== this.sessionToken) return;
      // We treat end as "not listening" and let controller decide next state
      this.isListening = false;
    };

    try {
      console.log("[STT] start");
      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      console.error("[STT] start exception:", e);
      onError(e);
    }
  }

  stop(): void {
    if (!this.recognition) return;
    if (!this.isListening) return;

    try {
      console.log("[STT] stop");
      this.recognition.stop();
    } catch (e) {
      console.warn("[STT] stop exception:", e);
    } finally {
      this.isListening = false;
      // Do NOT increment sessionToken here, we still want final results to flush
    }
  }

  abort(): void {
    if (!this.recognition) return;

    // Abort must invalidate callbacks instantly
    this.sessionToken++;

    try {
      console.log("[STT] abort");
      this.recognition.abort();
    } catch (e) {
      console.warn("[STT] abort exception:", e);
    } finally {
      this.isListening = false;
      // Nuke handlers to reduce weird browser edge cases
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
    }
  }
}
