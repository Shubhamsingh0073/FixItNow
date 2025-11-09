package FixItNow.repository;

import FixItNow.model.ProviderDocument;
import FixItNow.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProviderDocumentRepository extends JpaRepository<ProviderDocument, String> {
    Optional<ProviderDocument> findByProvider(Users provider);

	List<ProviderDocument> findAllByOrderByUploadedAtDesc();
}