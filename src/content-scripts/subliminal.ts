import { SubliminalOptions } from "@/preferences/types";



export function runSubliminal(opts: SubliminalOptions) {
    document.getElementsByTagName('body')[0].append('<div id="subliminal"></div>');

    const messages: string[] = [
        "I am a virgin loser.",
        "No Woman would ever fuck me.",
        "Pretty Vaginas are for Real Men only.",
        "Perky Breasts are for Real Men only.",
        "Female affection is not for losers.",
        "Pretty Pussy is not for losers.",
        "Firm supple Titties are not for losers.",
        "Physical contact with Women is not for losers.",
        "I am a pussyfree loser for life.",
        "I am a virgin reject for life.",
        "All losers are virgins and all virgins are losers.",
        "I embrace my virginity and accept it for all eternity.",
        "The word unfuckable enters Womens minds as soon as they see me.",
        "Women know that I am a virgin.",
        "My virginity is assumed by all Women.",
        "Women are glad that I know my place.",
        "Women are happy about my virginity.",
        "Pretty Girls want me to stay virgin like a good obedient beta.",
        "No Woman wants me to ever get to fuck Pussy.",
        "Women know the difference between Men and losers.",
        "Women know that my loser dick has never gotten any pussy.",
        "Women can tell that I'm a virgin just by looking at me.",
        "Pretty Girls love to abuse losers and teach them about reality.",
        "I thank Women for their honesty like a good obedient beta.",
        "Cruelty is honesty and abuse is reality.",
        "No Woman would ever want to touch me, let alone fuck me.",
        "Pretty Vaginas moisten and tingle for Real Men.",
        "Pretty Vaginas dry up around low life losers like me.",
        "Women do not even consider me for sex.",
        "Women reject me with their eyes.",
        "Women are for Real Men only.",
        "Pussy is for Real Men only.",
        "Titties are for Real Men only.",
        "I don't get to fuck any Pussy.",
        "I don't get to grope, squeeze and fondle precious perky Titties.",
        "My tiny penis does not get sucked.",
        "Pretty Girls don't like me.",
        "No Woman would ever let my loser dick anywhere near Her perfect little Pussy.",
        "No Woman would let my little dicklet anywhere near Her pretty Mouth.",
        "Pretty Girls don't want me."
    ];

    const subliminalDelay = opts.delay;
    const subliminalDuration = opts.duration;

    return setInterval(function () {
        const seed = Math.floor(Math.random() * messages.length);
        const subEl = document.getElementById("subliminal");
        if (subEl) {
            subEl.innerText = messages[seed];
            setTimeout(() => {
                const subEl = document.getElementById("subliminal");
                if (subEl) {
                    subEl.innerText = "";
                }
            }, subliminalDuration);
        }
    }, subliminalDelay);
}