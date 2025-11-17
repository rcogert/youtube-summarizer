declare module "youtube-transcript-api" {
  export const YouTubeTranscript: {
    fetchTranscript(
      videoId: string,
      options?: { lang?: string }
    ): Promise<Array<{ text: string; start: number }>>;
  };
}

