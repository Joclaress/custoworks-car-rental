import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { parse } from '../../middleware/error';
import { sendEmail } from '../../services/notification.service';
import { env } from '../../config/env';
import {
  saveInquiry,
  getInquiries,
  updateInquiryStatus,
  getQuotations,
  saveQuotation,
  deleteQuotation,
  sendQuotationEmail,
  generateQuotationPdfBuffer,
  QUOTATION_TEMPLATES,
  type Quotation,
  type CustomerInquiry,
} from '../../services/quotation.service';

export const contactRoutes = Router();

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(7, 'Please enter a valid phone number'),
  subject: z.string().optional().default('General Rental Inquiry'),
  inquiryType: z
    .enum(['GENERAL', 'BOOKING', 'CORPORATE', 'SPECIAL_ITINERARY', 'ROADSIDE_ASSISTANCE', 'FEEDBACK'])
    .optional()
    .default('GENERAL'),
  preferredVehicle: z.string().optional(),
  message: z.string().min(5, 'Message must be at least 5 characters'),
});

// Official Business & Support Information
const BUSINESS_CONTACT_INFO = {
  companyName: 'Custoworks Car Rental Naga City',
  hotline: '0961 722 5326 / 0995 382 7972',
  primaryPhone: '0961 722 5326',
  secondaryPhone: '0995 382 7972',
  email: 'custoworks1@gmail.com',
  address: 'Naga City, Camarines Sur, Bicol Region, Philippines',
  operatingHours: {
    office: 'Monday – Sunday: 8:00 AM – 8:00 PM',
    vehicleTurnover: '24/7 Vehicle Pickup & Return (with advance reservation)',
    roadsideAssistance: '24/7 Roadside Assistance in Naga & Camarines Sur',
  },
  socialLinks: {
    facebook: 'https://www.facebook.com/search/top?q=Custoworks%20Car%20Rental%20Naga%20City',
  },
  pickupLocations: [
    'Custoworks Garage (Naga City)',
    'SM City Naga Meetup / Pickup',
    'Naga Central Bus Terminal Meetup',
    'Naga Airport (WNP - Pili, Camarines Sur)',
    'Bicol International Airport (BIA - Daraga / Legazpi)',
    'Hotel & Home Delivery within Naga City Metro',
  ],
  faqs: [
    {
      question: 'How do I reserve a vehicle?',
      answer:
        'Simply select your vehicle and dates, fill in customer details, and pay the ₱1,000 reservation fee via GCash or Bank Transfer. Your vehicle is immediately locked for your dates.',
    },
    {
      question: 'What are the requirements for Self-Drive rentals?',
      answer:
        'Self-drive renters must present: 1) Valid Non-Professional or Professional Philippine Driver\'s License, 2) LTO LTMS Portal verified status (via QR code), 3) One secondary government ID, and 4) Proof of Billing or Company/Student ID.',
    },
    {
      question: 'Can I rent a car with a professional driver?',
      answer:
        'Yes! We provide professional, courteous, and polite drivers for Naga City trips, regional Bicol travels (Daet, Albay, Sorsogon, Caramoan), and Manila / Baguio express trips. No security deposit or driver\'s license required for with-driver rentals.',
    },
    {
      question: 'What is the security deposit and when is it returned?',
      answer:
        'A refundable security deposit of ₱3,000 (Sedans) or ₱5,000 (MPVs / Vans) is collected upon vehicle turnover. It is inspected and immediately refunded in cash or via GCash/Bank transfer upon returning the car in clean condition with the same fuel level.',
    },
    {
      question: 'What is your carwash / cleanliness policy?',
      answer:
        'Vehicles are released clean and sanitized. Renters are encouraged to return the car washed to receive 100% of the deposit back. If returned unwashed, a minimal carwash fee of ₱300 (Sedan) or ₱400 (MPV/Van) is deducted.',
    },
  ],
};

contactRoutes.get('/info', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: BUSINESS_CONTACT_INFO,
  });
});

// Customer submits inquiry
contactRoutes.post('/', async (req: Request, res: Response) => {
  const data = parse(contactSchema, req.body);
  const ticketId = `INQ-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const inquiry: CustomerInquiry = {
    id: ticketId,
    name: data.name,
    email: data.email,
    phone: data.phone,
    subject: data.subject || 'General Rental Inquiry',
    inquiryType: data.inquiryType || 'GENERAL',
    preferredVehicle: data.preferredVehicle,
    message: data.message,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  // Save inquiry to persistent storage
  saveInquiry(inquiry);

  // Send email to admin notification recipient
  try {
    const emailSubject = `[Custoworks Inquiry] #${ticketId} - ${data.subject} (${data.inquiryType})`;
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e3a8a;">New Customer Inquiry #${ticketId}</h2>
        <p><strong>Customer Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Phone:</strong> ${data.phone}</p>
        <p><strong>Inquiry Type:</strong> ${data.inquiryType}</p>
        ${data.preferredVehicle ? `<p><strong>Preferred Vehicle:</strong> ${data.preferredVehicle}</p>` : ''}
        <p><strong>Subject:</strong> ${data.subject}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <h3 style="color: #334155;">Message:</h3>
        <p style="background: #f8fafc; padding: 15px; border-radius: 6px; white-space: pre-wrap;">${data.message}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #64748b; font-size: 12px;">Custoworks Car Rental Naga City Automated Notification</p>
      </div>
    `;

    await sendEmail(
      env.ADMIN_NOTIFY_EMAIL || 'custoworks1@gmail.com',
      emailSubject,
      emailHtml,
      `Inquiry #${ticketId} from ${data.name} (${data.phone}, ${data.email}):\n\n${data.message}`
    );
  } catch (err) {
    console.error('Failed to dispatch contact email notification:', err);
  }

  res.status(201).json({
    success: true,
    ticketId,
    message: 'Your inquiry has been submitted successfully! Our team will respond shortly.',
    data: {
      ticketId,
      name: data.name,
      hotline: '0961 722 5326 / 0995 382 7972',
      estimatedResponseTime: 'Within 15 minutes',
    },
  });
});

// =============================================================================
// ADMIN PANEL ROUTES: INQUIRIES & QUOTATIONS
// =============================================================================

// Get all customer inquiries
contactRoutes.get('/admin/inquiries', (_req: Request, res: Response) => {
  const inquiries = getInquiries();
  res.json({
    success: true,
    data: inquiries,
  });
});

// Update status of an inquiry
contactRoutes.patch('/admin/inquiries/:id/status', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { status } = req.body;
  if (!['PENDING', 'QUOTED', 'RESOLVED'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }
  const updated = updateInquiryStatus(id, status);
  res.json({ success: updated });
});

// Get quotation templates
contactRoutes.get('/admin/templates', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: QUOTATION_TEMPLATES,
  });
});

// Get all quotations
contactRoutes.get('/admin/quotations', (_req: Request, res: Response) => {
  const quotations = getQuotations();
  res.json({
    success: true,
    data: quotations,
  });
});

// Save or update quotation
contactRoutes.post('/admin/quotations', (req: Request, res: Response) => {
  const body = req.body as Quotation;
  if (!body.customerName || !body.customerEmail || !body.vehicleName) {
    return res.status(400).json({ success: false, error: 'Customer name, email, and vehicle are required.' });
  }

  const quotation: Quotation = {
    ...body,
    id: body.id || `QT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
    createdAt: body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: body.status || 'DRAFT',
  };

  const saved = saveQuotation(quotation);
  res.status(201).json({
    success: true,
    data: saved,
  });
});

// Delete quotation
contactRoutes.delete('/admin/quotations/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const deleted = deleteQuotation(id);
  res.json({ success: deleted });
});

// Download official quotation PDF
contactRoutes.get('/admin/quotations/:id/pdf', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const quotations = getQuotations();
  const target = quotations.find((q) => q.id === id);
  if (!target) {
    return res.status(404).json({ success: false, error: 'Quotation not found' });
  }

  try {
    const buffer = await generateQuotationPdfBuffer(target);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Custoworks-Quotation-${target.id}.pdf"`);
    res.send(buffer);
  } catch (err) {
    console.error('Failed to generate quotation PDF:', err);
    res.status(500).json({ success: false, error: 'Failed to generate PDF document' });
  }
});

// Send quotation directly to customer via email (with PDF attachment)
contactRoutes.post('/admin/quotations/:id/send', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const quotations = getQuotations();
  let target = quotations.find((q) => q.id === id);

  // If quotation not found on disk (e.g. server redeployed or restarted), recover it from the request body
  if (!target && req.body && (req.body.id === id || req.body.customerEmail)) {
    const recovered = { ...req.body, id } as Quotation;
    saveQuotation(recovered);
    target = recovered;
  }

  if (!target) {
    return res.status(404).json({ success: false, error: `Quotation #${id} was not found on server. Please re-open and save.` });
  }

  const sendResult = await sendQuotationEmail(target);
  if (sendResult.success) {
    target.status = 'SENT';
    saveQuotation(target);
  }

  res.json({
    success: sendResult.success,
    message: sendResult.success
      ? `Quotation #${target.id} successfully emailed to ${target.customerEmail}`
      : `Failed to send email: ${sendResult.error || 'SMTP authentication failed'}`,
  });
});
