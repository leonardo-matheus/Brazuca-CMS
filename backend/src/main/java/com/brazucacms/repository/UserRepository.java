package com.brazucacms.repository;

import com.brazucacms.model.User;
import com.brazucacms.model.User.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository para operações de persistência de usuários.
 * 
 * @author Brazuca CMS
 * @version 1.0.0
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Busca usuário por email
     */
    Optional<User> findByEmail(String email);

    /**
     * Verifica se existe usuário com o email
     */
    boolean existsByEmail(String email);

    /**
     * Busca usuários por empresa
     */
    Page<User> findByCompanyId(Long companyId, Pageable pageable);

    /**
     * Lista usuários por empresa
     */
    List<User> findByCompanyId(Long companyId);

    /**
     * Busca usuários por role
     */
    List<User> findByRole(Role role);

    /**
     * Conta usuários por empresa
     */
    long countByCompanyId(Long companyId);

    /**
     * Busca usuários ativos por empresa
     */
    @Query("SELECT u FROM User u WHERE u.company.id = :companyId AND u.active = true")
    List<User> findActiveByCompanyId(@Param("companyId") Long companyId);

    /**
     * Pesquisa usuários por nome ou email
     */
    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.name) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :term, '%'))")
    Page<User> search(@Param("term") String searchTerm, Pageable pageable);

    /**
     * Pesquisa usuários de uma empresa por termo
     */
    @Query("SELECT u FROM User u WHERE u.company.id = :companyId AND (" +
           "LOWER(u.name) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :term, '%')))")
    Page<User> searchByCompany(@Param("companyId") Long companyId, 
                               @Param("term") String searchTerm, 
                               Pageable pageable);
}
