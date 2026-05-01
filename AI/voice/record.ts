export class VoiceRecorder {
    private mediaRecorder: MediaRecorder | null = null;
    private stream: MediaStream | null = null;
    private chunks: Blob[] = [];

    async start(): Promise<void> {
        if (typeof window === 'undefined') return;

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(this.stream);
            this.chunks = [];

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this.chunks.push(e.data);
                }
            };

            this.mediaRecorder.start();
        } catch (error) {
            console.error('Error starting recording:', error);
            throw error;
        }
    }

    stop(): Promise<Blob> {
        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
                resolve(new Blob(this.chunks, { type: 'audio/webm' }));
                return;
            }

            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.chunks, { type: 'audio/webm' });
                this.cleanup();
                resolve(blob);
            };

            this.mediaRecorder.stop();
        });
    }

    cancel(): void {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        this.cleanup();
    }

    private cleanup(): void {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.mediaRecorder = null;
        this.chunks = [];
    }
}
