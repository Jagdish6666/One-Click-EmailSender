package com.project.certificates.repository;

import com.project.certificates.entity.Participant;
import com.project.certificates.entity.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ParticipantRepository extends JpaRepository<Participant, Long> {
    List<Participant> findByStatusOrderByCreatedAtDesc(Status status);

    List<Participant> findByStatusInOrderByCreatedAtDesc(java.util.Collection<Status> statuses);

    List<Participant> findAllByOrderByCreatedAtDesc();

    default List<Participant> findByStatus(Status status) {
        return findByStatusOrderByCreatedAtDesc(status);
    }
}
