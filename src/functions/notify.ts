type NotifyInput = {
  channel: "email" | "sms";
  destination: string;
  message: string;
};

export async function handler(event: NotifyInput) {
  return {
    statusCode: 202,
    body: JSON.stringify({
      message: "notification queued",
      channel: event.channel,
      destination: event.destination,
      accepted: event.message.length > 0,
    }),
  };
}

