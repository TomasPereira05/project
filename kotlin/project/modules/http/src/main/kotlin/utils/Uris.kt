package pt.isel.jagoz.http.utils

import org.springframework.web.util.UriTemplate
import java.net.URI

object Uris {
    const val PREFIX = "/api"
    const val HOME = PREFIX

    fun home(): URI = URI(HOME)

    object Members {
        const val GET_BY_ID = "$PREFIX/members/{memberId}"
        const val GET_MEMBERS = "$PREFIX/members"
        const val CREATE_MEMBER = "$PREFIX/members/create"
        const val UPDATE_MEMBER = "$PREFIX/members/{memberId}"
        const val DELETE_MEMBER = "$PREFIX/members/{memberId}"
        const val GET_ACTIVE_MEMBERS = "$PREFIX/members/active"
        const val APPROVE_MEMBER = "$PREFIX/members/{memberId}/approve"
        const val REJECT_MEMBER = "$PREFIX/members/{memberId}/reject"
        const val REACTIVATE_MEMBER = "$PREFIX/members/{memberId}/reactivate"
        const val CHANGE_CATEGORY = "$PREFIX/members/{memberId}/category"

        fun byId(memberId: Long): URI = UriTemplate(GET_BY_ID).expand(memberId)
    }

    object Athletes {
        // Públicos (anónimo ok)
        const val LIST_BY_CATEGORY = "$PREFIX/teams/{teamCategoryId}/athletes"
        const val GET_PUBLIC_DETAIL = "$PREFIX/athletes/{athleteId}"

        // Autenticado — devolve detalhe completo do atleta do próprio user
        const val GET_ME = "$PREFIX/athletes/me"

        // Autenticado (qualquer role)
        const val CREATE_ATHLETE = "$PREFIX/athletes"

        // SECRETARIA / ADMIN
        const val GET_ALL_ADMIN = "$PREFIX/athletes"
        const val GET_ADMIN_DETAIL = "$PREFIX/athletes/{athleteId}/admin"
        const val GET_BY_MEMBER_ID = "$PREFIX/athletes/member/{memberId}"
        const val UPDATE_ATHLETE = "$PREFIX/athletes/{athleteId}"
        const val CHANGE_TEAM_CATEGORY = "$PREFIX/athletes/{athleteId}/team-category"
        const val DEACTIVATE_ATHLETE = "$PREFIX/athletes/{athleteId}/deactivate"
        const val REACTIVATE_ATHLETE = "$PREFIX/athletes/{athleteId}/reactivate"
        const val APPROVE_ATHLETE = "$PREFIX/athletes/{athleteId}/approve"
        const val REJECT_ATHLETE = "$PREFIX/athletes/{athleteId}/reject"

        fun byId(athleteId: Long): URI = UriTemplate(GET_PUBLIC_DETAIL).expand(athleteId)
    }

    object Users {
        const val GET_ALL = "$PREFIX/users"
        const val GET_BY_ID = "$PREFIX/users/{userId}"
        const val GET_BY_EMAIL = "$PREFIX/users/by-email"
        const val GET_BY_USERNAME = "$PREFIX/users/by-username"
        const val CREATE_USER = "$PREFIX/users"
        const val LOGIN = "$PREFIX/users/login"
        const val LOGOUT = "$PREFIX/users/logout"
        const val TOKEN = "$PREFIX/users/token"
        const val ME = "$PREFIX/users/me"

        fun byId(userId: Long): URI = UriTemplate(GET_BY_ID).expand(userId)
    }

    object Sponsors {
        const val GET_ALL = "$PREFIX/sponsors"
        const val GET_BY_ID = "$PREFIX/sponsors/{sponsorId}"
        const val CREATE = "$PREFIX/sponsors"
        const val UPDATE = "$PREFIX/sponsors/{sponsorId}"
        const val ASSIGN_USER = "$PREFIX/sponsors/{sponsorId}/user"
        const val CLAIM = "$PREFIX/sponsors/claim"
    }

    object Sponsorships {
        const val GET_ALL = "$PREFIX/sponsorships"
        const val CREATE = "$PREFIX/sponsorships"
        const val CREATE_WITH_SPONSOR = "$PREFIX/sponsorships/with-sponsor"
        const val MY = "$PREFIX/sponsorships/my"
        const val GET_BY_ID = "$PREFIX/sponsorships/{sponsorshipId}"
        const val GET_BY_SPONSOR = "$PREFIX/sponsors/{sponsorId}/sponsorships"
        const val APPROVE = "$PREFIX/sponsorships/{sponsorshipId}/approve"
        const val MARK_PAID = "$PREFIX/sponsorships/{sponsorshipId}/paid"
        const val CANCEL = "$PREFIX/sponsorships/{sponsorshipId}/cancel"
    }

    object SponsorshipCatalog {
        const val PUB_OPTIONS_ACTIVE = "$PREFIX/sponsorship-catalog/pub-options/active"
        const val PUB_OPTIONS = "$PREFIX/sponsorship-catalog/pub-options"
        const val PUB_OPTION_BY_ID = "$PREFIX/sponsorship-catalog/pub-options/{pubOptionId}"
        const val PUB_OPTIONS_REORDER = "$PREFIX/sponsorship-catalog/pub-options/reorder"

        const val EQUIPMENT_PLACEMENTS_ACTIVE = "$PREFIX/sponsorship-catalog/equipment-placements/active"
        const val EQUIPMENT_PLACEMENTS = "$PREFIX/sponsorship-catalog/equipment-placements"
        const val EQUIPMENT_PLACEMENT_BY_ID = "$PREFIX/sponsorship-catalog/equipment-placements/{placementId}"
        const val EQUIPMENT_PLACEMENTS_REORDER = "$PREFIX/sponsorship-catalog/equipment-placements/reorder"

        const val OTHER_SPORTS_ACTIVE = "$PREFIX/sponsorship-catalog/other-sports/active"
        const val OTHER_SPORTS = "$PREFIX/sponsorship-catalog/other-sports"
        const val OTHER_SPORT_BY_ID = "$PREFIX/sponsorship-catalog/other-sports/{sportId}"
        const val OTHER_SPORTS_REORDER = "$PREFIX/sponsorship-catalog/other-sports/reorder"
    }

    object Team {
        const val GROUPS_ACTIVE = "$PREFIX/teams/groups/active"
        const val GROUPS = "$PREFIX/teams/groups"
        const val GROUP_BY_ID = "$PREFIX/teams/groups/{groupId}"
        const val GROUPS_REORDER = "$PREFIX/teams/groups/reorder"
        const val GROUP_PRICES = "$PREFIX/teams/groups-prices"

        const val CATEGORY_OVERRIDES = "$PREFIX/teams/category-overrides"
        const val CATEGORIES_ACTIVE = "$PREFIX/teams/categories/active"
        const val CATEGORIES = "$PREFIX/teams/categories"
        const val CATEGORY_BY_ID = "$PREFIX/teams/categories/{categoryId}"
        const val CATEGORIES_REORDER = "$PREFIX/teams/categories/reorder"
    }
}
