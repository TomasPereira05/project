package pt.isel.jagoz.service

import pt.isel.jagoz.domain.sponsor.Sponsor
import pt.isel.jagoz.domain.sponsor.SponsorError
import pt.isel.jagoz.domain.sponsor.Sponsorship
import pt.isel.jagoz.domain.utils.Either

typealias SponsorResult = Either<SponsorError, Sponsor>
typealias SponsorshipResult = Either<SponsorError, Sponsorship>
