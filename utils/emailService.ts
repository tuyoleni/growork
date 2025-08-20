interface EmailData {
    to: string;
    subject: string;
    html: string;
    attachments?: EmailAttachment[];
}

interface EmailAttachment {
    filename: string;
    content: string | Buffer;
    contentType?: string;
    path?: string;
}

export const generateApplicationEmailHTML = (applicationData: any) => {
    const { applicant, job, status, appliedDate } = applicationData;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Job Application Update</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .status { padding: 10px 20px; border-radius: 5px; font-weight: bold; margin: 10px 0; }
        .status.pending { background: #fff3cd; color: #856404; }
        .status.reviewed { background: #d1ecf1; color: #0c5460; }
        .status.accepted { background: #d4edda; color: #155724; }
        .status.rejected { background: #f8d7da; color: #721c24; }
        .details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Job Application Update</h2>
          <p>Hello ${applicant.name || applicant.username},</p>
        </div>
        
        <div class="details">
          <h3>Application Details</h3>
          <p><strong>Job Title:</strong> ${job.title}</p>
          <p><strong>Company:</strong> ${job.company || 'Not specified'}</p>
          <p><strong>Applied Date:</strong> ${appliedDate}</p>
          <p><strong>Current Status:</strong> 
            <span class="status ${status.toLowerCase()}">${status}</span>
          </p>
        </div>
        
        <div class="footer">
          <p>This is an automated message from Growork. Please do not reply to this email.</p>
          <p>If you have any questions, please contact the company directly.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const prepareApplicationAttachments = async (applicationData: any, supabase: any) => {
    const attachments: EmailAttachment[] = [];

    try {
        // Add resume if available
        if (applicationData.resume_url) {
            const resumeResponse = await fetch(applicationData.resume_url);
            if (resumeResponse.ok) {
                const resumeBuffer = await resumeResponse.arrayBuffer();
                attachments.push({
                    filename: `resume_${applicationData.profiles?.username || 'applicant'}.pdf`,
                    content: Buffer.from(resumeBuffer),
                    contentType: 'application/pdf'
                });
            }
        }

        // Add cover letter if available
        if (applicationData.cover_letter) {
            attachments.push({
                filename: `cover_letter_${applicationData.profiles?.username || 'applicant'}.txt`,
                content: applicationData.cover_letter,
                contentType: 'text/plain'
            });
        }

        // Add any additional documents from the documents table
        if (applicationData.resume_id) {
            const { data: resumeDoc } = await supabase
                .from('documents')
                .select('*')
                .eq('id', applicationData.resume_id)
                .single();

            if (resumeDoc?.file_url) {
                const docResponse = await fetch(resumeDoc.file_url);
                if (docResponse.ok) {
                    const docBuffer = await docResponse.arrayBuffer();
                    attachments.push({
                        filename: resumeDoc.name || `document_${resumeDoc.id}.pdf`,
                        content: Buffer.from(docBuffer),
                        contentType: resumeDoc.type || 'application/pdf'
                    });
                }
            }
        }

        if (applicationData.cover_letter_id) {
            const { data: coverLetterDoc } = await supabase
                .from('documents')
                .select('*')
                .eq('id', applicationData.cover_letter_id)
                .single();

            if (coverLetterDoc?.file_url) {
                const docResponse = await fetch(coverLetterDoc.file_url);
                if (docResponse.ok) {
                    const docBuffer = await docResponse.arrayBuffer();
                    attachments.push({
                        filename: coverLetterDoc.name || `cover_letter_${coverLetterDoc.id}.pdf`,
                        content: Buffer.from(docBuffer),
                        contentType: coverLetterDoc.type || 'application/pdf'
                    });
                }
            }
        }

    } catch (error) {
        console.error('Error preparing attachments:', error);
    }

    return attachments;
};

export const generateStatusUpdateEmail = (applicationData: any, newStatus: string) => {
    const { applicant, job, appliedDate } = applicationData;

    let statusMessage = '';
    switch (newStatus.toLowerCase()) {
        case 'accepted':
            statusMessage = 'Congratulations! Your application has been accepted. The company will contact you soon with next steps.';
            break;
        case 'rejected':
            statusMessage = 'Thank you for your interest. Unfortunately, your application was not selected for this position.';
            break;
        case 'reviewed':
            statusMessage = 'Your application has been reviewed and is under consideration.';
            break;
        default:
            statusMessage = 'Your application status has been updated.';
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Application Status Update</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .status { padding: 10px 20px; border-radius: 5px; font-weight: bold; margin: 10px 0; }
        .status.accepted { background: #d4edda; color: #155724; }
        .status.rejected { background: #f8d7da; color: #721c24; }
        .status.reviewed { background: #d1ecf1; color: #0c5460; }
        .details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .message { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Application Status Update</h2>
          <p>Hello ${applicant.name || applicant.username},</p>
        </div>
        
        <div class="status ${newStatus.toLowerCase()}">
          Status: ${newStatus.toUpperCase()}
        </div>
        
        <div class="message">
          <p>${statusMessage}</p>
        </div>
        
        <div class="details">
          <h3>Application Details</h3>
          <p><strong>Job Title:</strong> ${job.title}</p>
          <p><strong>Company:</strong> ${job.company || 'Not specified'}</p>
          <p><strong>Applied Date:</strong> ${appliedDate}</p>
        </div>
        
        <div class="footer">
          <p>This is an automated message from Growork. Please do not reply to this email.</p>
          <p>If you have any questions, please contact the company directly.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
