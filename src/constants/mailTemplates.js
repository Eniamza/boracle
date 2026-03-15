export const swapRequestReceivedTemplate = (senderName, sectionName) => {
  const firstName = senderName?.split(' ')[0] || 'A student';
  const capitalizedFirstName = firstName !== 'A student'
    ? firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
    : firstName;

  return `
    <div style="font-family: 'Segoe UI', 'Inter', -apple-system, sans-serif; max-width: 560px; margin: 40px auto; background-color: #020817; border-radius: 16px; overflow: hidden;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); padding: 40px 40px 32px; text-align: center;">
        <div style="display: inline-block; background-color: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 10px 16px; margin-bottom: 20px;">
          <span style="color: #60a5fa; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; line-height: 1;">B</span>
        </div>
        <h1 style="color: #f1f5f9; font-size: 22px; font-weight: 700; margin: 0 0 6px;">New Swap Request</h1>
        <p style="color: #64748b; font-size: 14px; margin: 0;">Someone wants to swap with you</p>
      </div>

      <!-- Body -->
      <div style="padding: 32px 40px; text-align: center;">
        <p style="color: #94a3b8; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
          <strong style="color: #e2e8f0;">${capitalizedFirstName}</strong> has sent you a swap request for your listing
        </p>
        <div style="display: inline-block; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 14px 24px; margin-bottom: 32px;">
          <span style="color: #60a5fa; font-size: 15px; font-weight: 600;">${sectionName}</span>
        </div>
        <div style="margin: 8px 0 0;">
          <a href="https://boracle.app/dashboard/courseswap" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px;">View Request</a>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding: 20px 40px 28px; text-align: center; border-top: 1px solid #1e293b;">
        <p style="color: #475569; font-size: 13px; margin: 0;">Log in to your Boracle account to accept or reject this request.</p>
      </div>
    </div>
  `;
};

export const swapRequestStatusTemplate = (receiverName, status, sectionName) => {
  const isAccepted = status === "ACCEPTED";
  const statusColor = isAccepted ? "#34d399" : "#f87171";
  const statusBg = isAccepted ? "rgba(52, 211, 153, 0.1)" : "rgba(248, 113, 113, 0.1)";
  const statusBorder = isAccepted ? "rgba(52, 211, 153, 0.25)" : "rgba(248, 113, 113, 0.25)";
  const actionText = isAccepted ? "accepted" : "rejected";
  const emoji = isAccepted ? "✅" : "❌";

  const firstName = receiverName?.split(' ')[0] || 'A student';
  const capitalizedFirstName = firstName !== 'A student'
    ? firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
    : firstName;

  return `
    <div style="font-family: 'Segoe UI', 'Inter', -apple-system, sans-serif; max-width: 560px; margin: 40px auto; background-color: #020817; border-radius: 16px; overflow: hidden;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); padding: 40px 40px 32px; text-align: center;">
        <div style="display: inline-block; background-color: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 10px 16px; margin-bottom: 20px;">
          <span style="color: #60a5fa; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; line-height: 1;">B</span>
        </div>
        <h1 style="color: #f1f5f9; font-size: 22px; font-weight: 700; margin: 0 0 6px;">Swap Request Update</h1>
        <p style="color: #64748b; font-size: 14px; margin: 0;">Your swap request status has changed</p>
      </div>

      <!-- Body -->
      <div style="padding: 32px 40px; text-align: center;">
        <!-- Status Badge -->
        <div style="display: inline-block; background-color: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 20px; padding: 8px 20px; margin-bottom: 24px;">
          <span style="color: ${statusColor}; font-size: 14px; font-weight: 600;">${emoji} ${status}</span>
        </div>
        <p style="color: #94a3b8; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
          <strong style="color: #e2e8f0;">${capitalizedFirstName}</strong> has <strong style="color: ${statusColor};">${actionText}</strong> your swap request for
        </p>
        <div style="display: inline-block; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 14px 24px; margin-bottom: 32px;">
          <span style="color: #60a5fa; font-size: 15px; font-weight: 600;">${sectionName}</span>
        </div>
        ${isAccepted ? `
        <div>
          <p style="color: #94a3b8; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
            <strong style="color: #e2e8f0;">Head to B.O.R.A.C.L.E to view the contact details</strong>
          </p>
        </div>
        ` : `
        <div>
          <p style="color: #94a3b8; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
            <strong style="color: #e2e8f0;">Don't worry. Create your own swap request for more visibility ;3</strong>
          </p>
        </div>
        `}
        <div style="margin: 8px 0 0;">
          <a href="https://boracle.app/dashboard/courseswap" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px;">View Details</a>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding: 20px 40px 28px; text-align: center; border-top: 1px solid #1e293b;">
        <p style="color: #475569; font-size: 13px; margin: 0;">with love from B.O.R.A.C.L.E</p>
      </div>
    </div>
  `;
};

export const materialApprovedTemplate = (courseCode, description) => {
  return `
    <div style="font-family: 'Segoe UI', 'Inter', -apple-system, sans-serif; max-width: 560px; margin: 40px auto; background-color: #020817; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); padding: 40px 40px 32px; text-align: center;">
        <div style="display: inline-block; background-color: rgba(52, 211, 153, 0.15); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 12px; padding: 10px 16px; margin-bottom: 20px;">
          <span style="font-size: 22px;">✅</span>
        </div>
        <h1 style="color: #f1f5f9; font-size: 22px; font-weight: 700; margin: 0 0 6px;">Material Approved</h1>
        <p style="color: #64748b; font-size: 14px; margin: 0;">Your post is now live!</p>
      </div>

      <div style="padding: 32px 40px; text-align: center;">
        <p style="color: #94a3b8; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
          Great news! Your study material for <strong style="color: #e2e8f0;">${courseCode}</strong> has been approved by our moderators.
        </p>
        <div style="display: inline-block; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 14px 24px; margin-bottom: 32px; text-align: left; max-width: 100%;">
          <span style="color: #60a5fa; font-size: 14px; font-style: italic;">"${description}"</span>
        </div>
        <div style="margin: 8px 0 0;">
          <a href="https://boracle.app/course-materials" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px;">View Materials</a>
        </div>
      </div>

      <div style="padding: 20px 40px 28px; text-align: center; border-top: 1px solid #1e293b;">
        <p style="color: #475569; font-size: 13px; margin: 0;">Thank you for contributing to the community!</p>
      </div>
    </div>
  `;
};

export const materialRejectedTemplate = (courseCode, description, comment = null) => {
  return `
    <div style="font-family: 'Segoe UI', 'Inter', -apple-system, sans-serif; max-width: 560px; margin: 40px auto; background-color: #020817; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #3f1d1d 0%, #1a0f0f 100%); padding: 40px 40px 32px; text-align: center;">
        <div style="display: inline-block; background-color: rgba(248, 113, 113, 0.15); border: 1px solid rgba(248, 113, 113, 0.3); border-radius: 12px; padding: 10px 16px; margin-bottom: 20px;">
          <span style="font-size: 22px;">❌</span>
        </div>
        <h1 style="color: #f1f5f9; font-size: 22px; font-weight: 700; margin: 0 0 6px;">Material Update</h1>
        <p style="color: #cbd5e1; font-size: 14px; margin: 0;">Notice about your recent post</p>
      </div>

      <div style="padding: 32px 40px; text-align: center;">
        <p style="color: #94a3b8; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
          Unfortunately, your study material submission for <strong style="color: #e2e8f0;">${courseCode}</strong> could not be approved by our moderators, because it violated our guidelines or contained inappropriate content.
        </p>
        <div style="display: inline-block; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 14px 24px; margin-bottom: 32px; text-align: left; max-width: 100%;">
          <span style="color: #94a3b8; font-size: 14px; text-decoration: line-through; opacity: 0.7;">"${description}"</span>
        </div>
        ${comment ? `
        <div style="background-color: rgba(248, 113, 113, 0.1); border-left: 4px solid #f87171; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 32px; text-align: left;">
          <h4 style="color: #f87171; font-size: 14px; font-weight: 600; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">Moderator Comment</h4>
          <p style="color: #e2e8f0; font-size: 15px; line-height: 1.6; margin: 0;">${comment}</p>
        </div>
        ` : ''}
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; margin: 0;">
          If you believe this was a mistake, or you'd like to share an updated version, feel free to try sharing again!
        </p>
      </div>

      <div style="padding: 20px 40px 28px; text-align: center; border-top: 1px solid #1e293b;">
        <p style="color: #475569; font-size: 13px; margin: 0;">with love from B.O.R.A.C.L.E</p>
      </div>
    </div>
  `;
};
