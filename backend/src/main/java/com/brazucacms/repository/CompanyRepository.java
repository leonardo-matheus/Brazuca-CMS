package com.brazucacms.repository;

import com.brazucacms.model.Company;
import com.brazucacms.model.Company.CompanyStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

/**
 * Repository para operações de persistência de empresas.
 * 
 * Fornece métodos para:
 * - Busca por slug, CNPJ, status
 * - Listagem paginada
 * - Verificação de existência
 * - Estatísticas
 * 
 * @author Brazuca CMS
 * @version 1.0.0
 */
@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    /**
     * Busca empresa por slug
     * 
     * @param slug Slug da empresa
     * @return Optional com a empresa encontrada
     */
    Optional<Company> findBySlug(String slug);

    /**
     * Busca empresa por CNPJ
     * 
     * @param cnpj CNPJ da empresa
     * @return Optional com a empresa encontrada
     */
    Optional<Company> findByCnpj(String cnpj);

    /**
     * Verifica se existe empresa com o slug
     * 
     * @param slug Slug a verificar
     * @return true se existir
     */
    boolean existsBySlug(String slug);

    /**
     * Verifica se existe empresa com o CNPJ
     * 
     * @param cnpj CNPJ a verificar
     * @return true se existir
     */
    boolean existsByCnpj(String cnpj);

    /**
     * Busca empresas por status
     * 
     * @param status Status da empresa
     * @param pageable Paginação
     * @return Página de empresas
     */
    Page<Company> findByStatus(CompanyStatus status, Pageable pageable);

    /**
     * Busca empresas por nome (like)
     * 
     * @param name Nome ou parte do nome
     * @param pageable Paginação
     * @return Página de empresas
     */
    @Query("SELECT c FROM Company c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    Page<Company> findByNameContaining(@Param("name") String name, Pageable pageable);

    /**
     * Busca empresas por plano
     * 
     * @param plan Plano contratado
     * @return Lista de empresas
     */
    List<Company> findByPlan(Company.CompanyPlan plan);

    /**
     * Busca empresas ativas
     * 
     * @param pageable Paginação
     * @return Página de empresas ativas
     */
    @Query("SELECT c FROM Company c WHERE c.status = 'ACTIVE'")
    Page<Company> findAllActive(Pageable pageable);

    /**
     * Conta empresas por status
     * 
     * @param status Status a contar
     * @return Número de empresas
     */
    long countByStatus(CompanyStatus status);

    /**
     * Conta empresas por plano
     * 
     * @param plan Plano a contar
     * @return Número de empresas
     */
    long countByPlan(Company.CompanyPlan plan);

    /**
     * Busca empresas com plano próximo de expirar
     * 
     * @param pageable Paginação
     * @return Página de empresas
     */
    @Query("SELECT c FROM Company c WHERE c.planExpiresAt IS NOT NULL " +
           "AND c.planExpiresAt <= CURRENT_TIMESTAMP + 7 DAY " +
           "AND c.status = 'ACTIVE'")
    Page<Company> findWithExpiringPlan(Pageable pageable);

    /**
     * Busca empresas por estado/UF
     * 
     * @param state Estado/UF
     * @return Lista de empresas
     */
    List<Company> findByState(String state);

    /**
     * Pesquisa geral em empresas
     * 
     * @param searchTerm Termo de busca
     * @param pageable Paginação
     * @return Página de empresas
     */
    @Query("SELECT c FROM Company c WHERE " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(c.slug) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(c.cnpj) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(c.contactEmail) LIKE LOWER(CONCAT('%', :term, '%'))")
    Page<Company> search(@Param("term") String searchTerm, Pageable pageable);

    /**
     * Calcula uso total de armazenamento de todas as empresas
     * 
     * @return Total em MB
     */
    @Query("SELECT COALESCE(SUM(c.storageUsedMb), 0) FROM Company c")
    Long getTotalStorageUsed();

    /**
     * Busca empresas por cidade
     * 
     * @param city Cidade
     * @param pageable Paginação
     * @return Página de empresas
     */
    Page<Company> findByCity(String city, Pageable pageable);
}
