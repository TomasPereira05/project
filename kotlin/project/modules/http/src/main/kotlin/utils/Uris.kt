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
}
