package pt.isel.jagoz.http.model.athlete

import pt.isel.jagoz.domain.athlete.Athlete
import pt.isel.jagoz.domain.member.Member
import pt.isel.jagoz.domain.member.MemberStatus

/**
 * Card leve de um atleta gerido por uma conta de user (a secção "Os Meus Atletas" do
 * perfil). Só expõe o que o painel precisa — nome, escalão, estado e se a quota está em
 * atraso — sem os dados sensíveis do `AthleteAdminDto` (NIF/BI/NISS, morada, guardians).
 *
 * Consumido por: `GET /api/athletes/managed`.
 */
data class ManagedAthleteDto(
    val athleteId: Long,
    val memberId: Long,
    val name: String,
    val teamCategoryLabel: String,
    /** PENDENTE | REJEITADO | ATIVO | INATIVO — mesma derivação do `AthleteAdminDto`. */
    val status: String,
    /** Quota mensal com algum mês anterior por pagar (calculado pelo PaymentService). */
    val feeOverdue: Boolean,
)

fun Athlete.toManagedAthleteDto(
    member: Member,
    feeOverdue: Boolean,
): ManagedAthleteDto =
    ManagedAthleteDto(
        athleteId = athleteId,
        memberId = memberId,
        name = member.completeName,
        teamCategoryLabel = teamCategory.label,
        status =
            when (member.status) {
                MemberStatus.PENDENTE -> "PENDENTE"
                MemberStatus.REJEITADO -> "REJEITADO"
                MemberStatus.ATIVO -> if (active) "ATIVO" else "INATIVO"
                MemberStatus.INATIVO -> "INATIVO"
            },
        feeOverdue = feeOverdue,
    )
