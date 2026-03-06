export const swapRequestReceivedTemplate = (senderName, sectionName) => {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #1a1a1a; margin-bottom: 20px;">New Swap Request</h2>
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5; margin-bottom: 16px;">
        Hello,
      </p>
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
        <strong>${senderName}</strong> has sent you a request for your swap post <strong style="color: #000;">${sectionName}</strong>.
      </p>
      <div style="margin: 32px 0;">
        <a href="https://boracle.app/dashboard/courseswap" style="background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">View Request</a>
      </div>
      <p style="color: #8c8c8c; font-size: 14px; margin-top: 32px; border-top: 1px solid #eaeaea; padding-top: 16px;">
        Please log in to your Boracle account to accept or reject this request.
      </p>
    </div>
  `;
};

export const swapRequestStatusTemplate = (receiverName, status, sectionName) => {
  const statusColor = status === "ACCEPTED" ? "#10b981" : "#ef4444"; // Emerald 500 or Red 500
  const actionText = status === "ACCEPTED" ? "accepted" : "rejected";

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #1a1a1a; margin-bottom: 20px;">Swap Request Update</h2>
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5; margin-bottom: 16px;">
        Hello,
      </p>
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
        <strong>${receiverName}</strong> has <strong style="color: ${statusColor};">${actionText}</strong> your swap request for <strong style="color: #000;">${sectionName}</strong>.
      </p>
      <div style="margin: 32px 0;">
        <a href="https://boracle.app/dashboard/courseswap" style="background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">View Details</a>
      </div>
    </div>
  `;
};
