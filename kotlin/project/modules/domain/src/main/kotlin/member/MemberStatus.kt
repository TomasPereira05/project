package pt.isel.member

enum class MemberStatus {
    PENDENTE, // Aguarda aprovação dos diretores
    ATIVO, // Sócio aprovado e ativo
    INATIVO, // Deixou de ser sócio (pode reativar e recuperar o número)
    REJEITADO,
}
