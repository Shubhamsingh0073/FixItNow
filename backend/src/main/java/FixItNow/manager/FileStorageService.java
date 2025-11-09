package FixItNow.manager;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.UrlResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path rootLocation;
    private final long maxBytes;
    private final boolean enforcePdf;

    public FileStorageService(
            @Value("${app.upload.dir:uploads}") String uploadDir,
            @Value("${app.upload.max-bytes:1048576}") long maxBytes, // default 1MB
            @Value("${app.upload.enforce-pdf:true}") boolean enforcePdf
    ) {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.maxBytes = maxBytes;
        this.enforcePdf = enforcePdf;
        try {
            Files.createDirectories(this.rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory: " + this.rootLocation, e);
        }
    }

    /**
     * Store the incoming multipart file under optional subfolder and a generated filename.
     * Returns the absolute path to the stored file.
     *
     * Throws RuntimeException on validation/storage errors.
     */
    public String store(MultipartFile file, String subfolder, String prefix) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No file provided");
        }

        // optional server-side mime / extension check for PDF
        if (enforcePdf) {
            String contentType = file.getContentType();
            String original = StringUtils.cleanPath(file.getOriginalFilename()).toLowerCase();
            if (contentType == null || (!contentType.equals("application/pdf") && !original.endsWith(".pdf"))) {
                throw new IllegalArgumentException("Only PDF files are allowed");
            }
        }

        if (file.getSize() > maxBytes) {
            throw new IllegalArgumentException("File too large. Max allowed bytes = " + maxBytes);
        }

        String original = StringUtils.cleanPath(file.getOriginalFilename());
        String ext = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0) ext = original.substring(dot);

        String filename = (prefix == null ? "" : prefix + "_") + UUID.randomUUID().toString().replace("-", "").substring(0, 12) + ext;

        Path dir = this.rootLocation;
        if (subfolder != null && !subfolder.isBlank()) {
            dir = dir.resolve(subfolder);
        }

        try {
            Files.createDirectories(dir);
            Path target = dir.resolve(filename).normalize();
            // avoid path traversal
            if (!target.toAbsolutePath().startsWith(this.rootLocation.toAbsolutePath())) {
                throw new SecurityException("Cannot store file outside current directory.");
            }
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return target.toString();
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file " + original, e);
        }
    }

    /**
     * Load a stored file (full path returned by store) as a Spring Resource for streaming.
     * Returns null if not found or unreadable.
     */
    public Resource loadAsResource(String fullPath) {
        if (fullPath == null || fullPath.isBlank()) return null;
        try {
            Path file = Paths.get(fullPath).toAbsolutePath().normalize();
            if (!Files.exists(file) || !Files.isReadable(file)) return null;
            // ensure file is inside upload dir
            if (!file.startsWith(this.rootLocation)) {
                return null;
            }
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                return null;
            }
        } catch (MalformedURLException e) {
            return null;
        }
    }

    /**
     * Helper: returns the configured root uploads path (useful for debugging/tests).
     */
    public Path getRootLocation() {
        return rootLocation;
    }
}