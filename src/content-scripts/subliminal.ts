import { SubliminalOptions } from "@/preferences/types";



export function runSubliminal(opts: SubliminalOptions) {
    document.getElementsByTagName('body')[0].append('<div id="subliminal"></div>');

    let messages: string[] = [];
    messages.push("I am a virgin loser.");
    messages.push("No Woman would ever fuck me.");
    messages.push("Pretty Vaginas are for Real Men only.");
    messages.push("Perky Breasts are for Real Men only.");
    messages.push("Female affection is not for losers.");
    messages.push("Pretty Pussy is not for losers.");
    messages.push("Firm supple Titties are not for losers.");
    messages.push("Physical contact with Women is not for losers.");
    messages.push("I am a pussyfree loser for life.");
    messages.push("I am a virgin reject for life.");
    messages.push("All losers are virgins and all virgins are losers.");
    messages.push("I embrace my virginity and accept it for all eternity.");
    messages.push("The word unfuckable enters Womens minds as soon as they see me.");
    messages.push("Women know that I am a virgin.");
    messages.push("My virginity is assumed by all Women.");
    messages.push("Women are glad that I know my place.");
    messages.push("Women are happy about my virginity.");
    messages.push("Pretty Girls want me to stay virgin like a good obedient beta.");
    messages.push("No Woman wants me to ever get to fuck Pussy.");
    messages.push("Women know the difference between Men and losers.");
    messages.push("Women know that my loser dick has never gotten any pussy.");
    messages.push("Women can tell that I'm a virgin just by looking at me.");
    messages.push("Pretty Girls love to abuse losers and teach them about reality.");
    messages.push("I thank Women for their honesty like a good obedient beta.");
    messages.push("Cruelty is honesty and abuse is reality.");
    messages.push("No Woman would ever want to touch me, let alone fuck me.");
    messages.push("Pretty Vaginas moisten and tingle for Real Men.");
    messages.push("Pretty Vaginas dry up around low life losers like me.");
    messages.push("Women do not even consider me for sex.");
    messages.push("Women reject me with their eyes.");
    messages.push("Women are for Real Men only.");
    messages.push("Pussy is for Real Men only.");
    messages.push("Titties are for Real Men only.");
    messages.push("I don't get to fuck any Pussy.");
    messages.push("I don't get to grope, squeeze and fondle precious perky Titties.");
    messages.push("My tiny penis does not get sucked.");
    messages.push("Pretty Girls don't like me.");
    messages.push("No Woman would ever let my loser dick anywhere near Her perfect little Pussy.");
    messages.push("No Woman would let my little dicklet anywhere near Her pretty Mouth.");
    messages.push("Pretty Girls don't want me.");

    let subliminalDelay = opts.delay;
    let subliminalDuration = opts.duration;

    return setInterval(function () {
        let seed = Math.floor(Math.random() * messages.length);
        let subEl = document.getElementById("subliminal");
        if (subEl) {
            subEl.innerText = messages[seed];
            setTimeout(() => {
                let subEl = document.getElementById("subliminal");
                if (subEl) {
                    subEl.innerText = "";
                }
            }, subliminalDuration);
        }
    }, subliminalDelay);
}