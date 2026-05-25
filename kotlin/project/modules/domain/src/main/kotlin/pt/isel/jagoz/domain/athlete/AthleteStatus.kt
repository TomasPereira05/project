package pt.isel.jagoz.domain.athlete

/**
 * Estado "visual" do atleta, derivado do par (Member.status, Athlete.active):
 *  - PENDENTE  : Member ainda não aprovado pela secretaria
 *  - ATIVO     : Member aprovado e atleta a jogar (active=true)
 *  - INATIVO   : Member aprovado mas atleta marcado inactivo (ex-jogador)
 *  - REJEITADO : Member rejeitado
 *
 * A derivação para apresentação vive no DTO (`AthleteAdminDto.deriveStatus`); este
 * enum existe para o pedido de filtragem da listagem admin e para a tradução desse
 * estado em condições SQL no repositório.
 */
enum class AthleteStatus {
    PENDENTE,
    ATIVO,
    INATIVO,
    REJEITADO,
}
