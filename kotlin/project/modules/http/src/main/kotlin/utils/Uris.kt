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
        const val GET_BY_ID = "$PREFIX/athletes/{athleteId}"
        const val GET_BY_MEMBER_ID = "$PREFIX/athletes/member/{memberId}"
        const val GET_ACTIVE_ATHLETES = "$PREFIX/athletes/active"
        const val CREATE_ATHLETE = "$PREFIX/athletes"
        const val CHANGE_TEAM_CATEGORY = "$PREFIX/athletes/{athleteId}/team-category"
        const val UPDATE_SCHOOL_INFO = "$PREFIX/athletes/{athleteId}/school-info"
        const val DEACTIVATE_ATHLETE = "$PREFIX/athletes/{athleteId}"
        const val REACTIVATE_ATHLETE = "$PREFIX/athletes/{athleteId}/reactivate"

        fun byId(athleteId: Long): URI = UriTemplate(GET_BY_ID).expand(athleteId)
    }

    object Users {
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
    }

    object Sponsorships {
        const val CREATE = "$PREFIX/sponsorships"
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
        const val PUB_OPTION_PRICES = "$PREFIX/sponsorship-catalog/pub-option-prices"

        const val TEAM_CATEGORIES_ACTIVE = "$PREFIX/sponsorship-catalog/team-categories/active"
        const val TEAM_CATEGORIES = "$PREFIX/sponsorship-catalog/team-categories"
        const val TEAM_CATEGORY_BY_ID = "$PREFIX/sponsorship-catalog/team-categories/{teamCategoryId}"
        const val TEAM_CATEGORIES_REORDER = "$PREFIX/sponsorship-catalog/team-categories/reorder"
        const val TEAM_PRICES = "$PREFIX/sponsorship-catalog/team-prices"

        const val EQUIPMENT_PLACEMENTS_ACTIVE = "$PREFIX/sponsorship-catalog/equipment-placements/active"
        const val EQUIPMENT_PLACEMENTS = "$PREFIX/sponsorship-catalog/equipment-placements"
        const val EQUIPMENT_PLACEMENT_BY_ID = "$PREFIX/sponsorship-catalog/equipment-placements/{placementId}"
        const val EQUIPMENT_PLACEMENTS_REORDER = "$PREFIX/sponsorship-catalog/equipment-placements/reorder"

        const val OTHER_SPORTS_ACTIVE = "$PREFIX/sponsorship-catalog/other-sports/active"
        const val OTHER_SPORTS = "$PREFIX/sponsorship-catalog/other-sports"
        const val OTHER_SPORT_BY_ID = "$PREFIX/sponsorship-catalog/other-sports/{sportId}"
        const val OTHER_SPORTS_REORDER = "$PREFIX/sponsorship-catalog/other-sports/reorder"
        const val OTHER_SPORT_PRICES = "$PREFIX/sponsorship-catalog/other-sport-prices"
    }
}
