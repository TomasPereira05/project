package pt.isel.jagoz.domain.athlete

data class Guardian(
    val guardianId: Long,
    // Aponta para o Atleta (Menor)
    val athleteId: Long,
    // Caso o encarregado de educação seja sócio
    val memberId: Long?,
    val name: String,
    val role: GuardianRole,
    /**
     * Grau de parentesco com o atleta. Só preenchido quando [role] == [GuardianRole.LEGAL_GUARDIAN]
     * (porque para FATHER/MOTHER o próprio role já indica o grau). Validação cruzada
     * em [AthleteDomain.validateGuardianForCreation] + CHECK constraint na BD.
     */
    val kinship: String?,
    val email: String,
    val phone: String,
    // "Actividade Profissional" no formulário (antes chamava-se "work")
    val professionalActivity: String?,
    /**
     * "Telefone Contacto" do Encarregado de Educação no formulário.
     * Só preenchido quando [role] == [GuardianRole.LEGAL_GUARDIAN].
     */
    val contactPhone: String?,
)
