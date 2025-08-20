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
        console.log('Preparing attachments for:', applicationData.documents);

        // Add documents from the documents array (already fetched)
        if (applicationData.documents && applicationData.documents.length > 0) {
            console.log(`Found ${applicationData.documents.length} documents to process`);

            for (const doc of applicationData.documents) {
                console.log('Processing document:', doc);

                if (doc.file_url) {
                    try {
                        console.log('Fetching document from:', doc.file_url);
                        const docResponse = await fetch(doc.file_url);

                        if (docResponse.ok) {
                            const docBuffer = await docResponse.arrayBuffer();
                            const attachment = {
                                filename: doc.name || `${doc.type}_${applicationData.profiles?.username || 'applicant'}.pdf`,
                                content: Buffer.from(docBuffer),
                                contentType: doc.type === 'cv' ? 'application/pdf' :
                                    doc.type === 'cover_letter' ? 'application/pdf' : 'application/pdf'
                            };

                            attachments.push(attachment);
                            console.log('Successfully added attachment:', attachment.filename);
                        } else {
                            console.error(`Failed to fetch document ${doc.name}:`, docResponse.status);
                        }
                    } catch (error) {
                        console.error(`Error fetching document ${doc.name}:`, error);
                    }
                } else {
                    console.log('Document has no file_url:', doc);
                }
            }
        } else {
            console.log('No documents found in applicationData.documents');
        }

        // Fallback: Add resume if available from resume_url
        if (applicationData.resume_url && attachments.length === 0) {
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

        // Fallback: Add cover letter if available as text
        if (applicationData.cover_letter && attachments.length === 0) {
            attachments.push({
                filename: `cover_letter_${applicationData.profiles?.username || 'applicant'}.txt`,
                content: applicationData.cover_letter,
                contentType: 'text/plain'
            });
        }

    } catch (error) {
        console.error('Error preparing attachments:', error);
    }

    return attachments;
};

export const generateStatusUpdateEmail = (applicationData: any, newStatus: string) => {
    // Extract data from the applicationData structure
    const applicant = applicationData.profiles || {};
    const job = applicationData.posts || {};
    const companies = applicationData.companies || null;
    const documents = applicationData.documents || [];
    const appliedDate = applicationData.appliedDate || new Date(applicationData.created_at).toLocaleDateString();

    const hasDocuments = documents && documents.length > 0;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Job Application - ${job.title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .applicant-info { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .job-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .company-info { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .documents-info { background: #fff8dc; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .attachments { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        .highlight { background: #d4edda; color: #155724; padding: 10px; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Job Application Received</h2>
          <p>Dear HR Team,</p>
          <p>A new application has been submitted for the <strong>${job.title}</strong> position.</p>
        </div>
        
        <div class="highlight">
          <strong>Application Status: ${newStatus.toUpperCase()}</strong>
        </div>
        
        <div class="applicant-info">
          <h3>Applicant Information</h3>
          <p><strong>Name:</strong> ${applicant.name && applicant.surname ? `${applicant.name} ${applicant.surname}` : applicant.username}</p>
          <p><strong>Username:</strong> ${applicant.username}</p>
          <p><strong>Applied Date:</strong> ${appliedDate}</p>
          ${applicant.profession ? `<p><strong>Profession:</strong> ${applicant.profession}</p>` : ''}
          ${applicant.experience_years ? `<p><strong>Experience:</strong> ${applicant.experience_years} years</p>` : ''}
          ${applicant.education ? `<p><strong>Education:</strong> ${applicant.education}</p>` : ''}
          ${applicant.location ? `<p><strong>Location:</strong> ${applicant.location}</p>` : ''}
          ${applicant.phone ? `<p><strong>Phone:</strong> ${applicant.phone}</p>` : ''}
          ${applicant.website ? `<p><strong>Website:</strong> <a href="${applicant.website}">${applicant.website}</a></p>` : ''}
          ${applicant.skills && applicant.skills.length > 0 ? `<p><strong>Skills:</strong> ${applicant.skills.join(', ')}</p>` : ''}
          ${applicant.bio ? `<p><strong>Bio:</strong> ${applicant.bio}</p>` : ''}
        </div>
        
        <div class="job-info">
          <h3>Job Details</h3>
          <p><strong>Position:</strong> ${job.title}</p>
          <p><strong>Type:</strong> ${job.type}</p>
          <p><strong>Industry:</strong> ${job.industry || 'Not specified'}</p>
          ${job.content ? `<p><strong>Job Description:</strong> ${job.content}</p>` : ''}
          ${job.criteria ? `
            <p><strong>Requirements:</strong></p>
            <ul>
              ${Object.entries(job.criteria)
                .filter(([key]) => !['companyId', 'company_id'].includes(key)) // Filter out companyId variations
                .map(([key, value]) => {
                    const label = key === 'salary' ? 'Salary' :
                        key === 'company' ? 'Company' :
                            key === 'jobType' ? 'Job Type' :
                                key === 'location' ? 'Location' :
                                    key.charAt(0).toUpperCase() + key.slice(1);
                    return `<li><strong>${label}:</strong> ${value}</li>`;
                }).join('')}
            </ul>
            <!-- Debug: Raw criteria: ${JSON.stringify(job.criteria)} -->
          ` : ''}
          <p><strong>Posted:</strong> ${new Date(job.created_at).toLocaleDateString()}</p>
        </div>

        ${companies ? `
        <div class="company-info">
          <h3>Company Information</h3>
          <p><strong>Company Name:</strong> ${companies.name}</p>
          ${companies.description ? `<p><strong>Description:</strong> ${companies.description}</p>` : ''}
          ${companies.industry ? `<p><strong>Industry:</strong> ${companies.industry}</p>` : ''}
          ${companies.size ? `<p><strong>Company Size:</strong> ${companies.size}</p>` : ''}
          ${companies.location ? `<p><strong>Location:</strong> ${companies.location}</p>` : ''}
          ${companies.website ? `<p><strong>Website:</strong> <a href="${companies.website}">${companies.website}</a></p>` : ''}
          ${companies.founded_year ? `<p><strong>Founded:</strong> ${companies.founded_year}</p>` : ''}
        </div>
        ` : ''}

        ${hasDocuments ? `
        <div class="documents-info">
          <h3>Documents Submitted</h3>
          <p>The applicant has submitted the following documents. Click the links to download:</p>
          <ul>
            ${documents.map((doc: any) => `
              <li>
                <strong>${doc.name || doc.type}:</strong> 
                <a href="${doc.file_url}" target="_blank" style="color: #007bff; text-decoration: underline;">
                  Download ${doc.name || doc.type}
                </a>
              </li>
            `).join('')}
          </ul>
        </div>
        ` : ''}
        
        <div class="footer">
          <p>This is an automated notification from Growork Application System.</p>
          <p>Please review the application and contact the applicant directly if needed.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
