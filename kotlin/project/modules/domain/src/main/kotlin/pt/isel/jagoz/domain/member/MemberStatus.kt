package pt.isel.jagoz.domain.member

enum class MemberStatus {
    PENDENTE, // Aguarda aprovaÃ§Ã£o dos diretores
    ATIVO, // SÃ³cio aprovado e ativo
    INATIVO, // Deixou de ser sÃ³cio (pode reativar e recuperar o nÃºmero)
    REJEITADO,
}
