package com.project.certificates.util;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.PdfStamper;
import com.lowagie.text.pdf.PdfWriter;
import com.project.certificates.entity.Participant;
import com.project.certificates.entity.CertificateTemplate;
import com.project.certificates.repository.CertificateTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.Optional;

@Component
@Slf4j
@RequiredArgsConstructor
public class CertificatePdfGenerator {

    private final CertificateTemplateRepository templateRepository;

    public byte[] generate(Participant participant) {
        Optional<CertificateTemplate> templateOpt = templateRepository.findByActive(true);
        if (templateOpt.isPresent()) {
            try {
                return generateFromTemplate(participant, templateOpt.get());
            } catch (Exception e) {
                log.error("Failed to generate from template, falling back to default", e);
            }
        }
        return generateDefault(participant);
    }

    private byte[] generateFromTemplate(Participant participant, CertificateTemplate template) throws Exception {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfReader reader = new PdfReader(template.getContent());
            PdfStamper stamper = new PdfStamper(reader, out);

            // Get the first page
            PdfContentByte canvas = stamper.getOverContent(1);

            // Use Helvetica Bold for a formal look
            com.lowagie.text.pdf.BaseFont bf = com.lowagie.text.pdf.BaseFont.createFont(
                    com.lowagie.text.pdf.BaseFont.HELVETICA_BOLD,
                    com.lowagie.text.pdf.BaseFont.CP1252,
                    com.lowagie.text.pdf.BaseFont.NOT_EMBEDDED);

            canvas.beginText();
            canvas.setColorFill(java.awt.Color.BLACK);

            // Center the name on the page
            float pageWidth = reader.getPageSize(1).getWidth();
            float pageHeight = reader.getPageSize(1).getHeight();
            float centerX = pageWidth / 2;

            // Position Name - Using custom offsets
            int nameOffset = template.getNameY() != null ? template.getNameY() : 0;
            int eventOffset = template.getEventY() != null ? template.getEventY() : -50;
            int fontSize = template.getFontSize() != null ? template.getFontSize() : 42;

            canvas.setFontAndSize(bf, fontSize);
            canvas.showTextAligned(Element.ALIGN_CENTER, participant.getName().toUpperCase(), centerX,
                    (pageHeight / 2) + nameOffset, 0);

            // Position Event - Below the name
            canvas.setFontAndSize(bf, 18);
            canvas.showTextAligned(Element.ALIGN_CENTER, participant.getEventName(), centerX,
                    (pageHeight / 2) + eventOffset, 0);

            // Position ID - At the bottom center for formality
            canvas.setFontAndSize(bf, 10);
            canvas.showTextAligned(Element.ALIGN_CENTER, "Certificate ID: " + participant.getCertificateId(), centerX,
                    30, 0);

            canvas.endText();
            stamper.close();
            reader.close();

            return out.toByteArray();
        }
    }

    public byte[] generateDefault(Participant participant) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 56, 56, 56, 56);
            PdfWriter.getInstance(document, out);
            document.open();
            // ... (rest of old logic)
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 34);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 18);
            Font nameFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 30);
            Font detailFont = FontFactory.getFont(FontFactory.HELVETICA, 12);

            Paragraph title = new Paragraph("CERTIFICATE OF PARTICIPATION", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(48);
            document.add(title);

            Paragraph intro = new Paragraph("This certificate is proudly presented to", bodyFont);
            intro.setAlignment(Element.ALIGN_CENTER);
            intro.setSpacingAfter(18);
            document.add(intro);

            Paragraph name = new Paragraph(participant.getName(), nameFont);
            name.setAlignment(Element.ALIGN_CENTER);
            name.setSpacingAfter(28);
            document.add(name);

            Paragraph event = new Paragraph("for successful participation in " + participant.getEventName(), bodyFont);
            event.setAlignment(Element.ALIGN_CENTER);
            event.setSpacingAfter(56);
            document.add(event);

            Paragraph details = new Paragraph(
                    "Date: " + LocalDate.now() + "\nCertificate ID: " + participant.getCertificateId(),
                    detailFont);
            details.setAlignment(Element.ALIGN_CENTER);
            document.add(details);

            document.close();
            return out.toByteArray();
        } catch (Exception ex) {
            log.error("Failed to generate default certificate PDF for participant {}", participant.getId(), ex);
            throw new IllegalStateException("PDF generation failed");
        }
    }
}
