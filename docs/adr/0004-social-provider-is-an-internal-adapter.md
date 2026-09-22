# The social vendor is an internal adapter

Capyra's public API and UI speak only Capyra types. All network connection, publishing, analytics and ad-library calls go through an internal `SocialProvider`. The first implementation is Zernio, plus a `MockProvider` that is never a silent production fallback.

Calling the vendor from the web app, or leaking vendor IDs as public identifiers, would be faster and would couple every screen to one supplier. The cost of swapping later — and the white-label requirement that the operator never see that supplier — is why the extra layer exists now.
