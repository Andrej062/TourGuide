document.addEventListener('DOMContentLoaded', () => {
    const langSelect = document.getElementById('language-select');


const texts = {

        // index

    EN: {
        exploreLink: 'Explore',
        reviewsLink: 'Reviews',
        aboutLink: 'About',
        contactLink: 'Contact',
        bergen: 'Bergen',
        heroText: 'Choose your dream tour and experience hidden gems, and the very best that Bergen has to offer.',
        destinationSearch: 'Search for destination...',
        trollskogenInfo: '',

        // about

        overAbout: 'About Gems of Bergen: Your Gateway to Bergen',
        aboutHeroContent: 'Welcome to Gems of Bergen, your ultimate destination for discovering the best hidden gems in Bergen! We’re a youth-run company created by passionate teenagers who want to give you the best experience possible. Our specialized tours are designed for people of all ages and interests, offering unique experiences tailored to what you want to explore.',
        overMission: 'Our Mission and Core Values',
        overMission1: 'Showcasing the Best of Bergen',
        overMission2: 'Supporting',
        missionContent1: 'Our primary goal is to make your journey through Bergen as rich and comfortable as possible. We focus on the quality of our routes, safety, and the sustainability of our tours, ensuring every adventure is not only thrilling but also responsible.',
        missionContent2: 'When you choose Gems of Bergen, you’re also supporting young people in their very first job. We give youth the opportunity to gain real work experience while practicing foreign languages in a meaningful way.', 
        missionContent3: ' So, when you join a tour with Gems of Bergen, you’re not only discovering the local side of Bergen with enthusiastic guides — you’re also helping support a movement that gives young people their first step into the working world.',
        teamText: 'Meet Our Dedicated Team',
        callToActionText: 'Ready to Start Your Adventure?',
        callToActionBtn: 'Explore Tours',
        ContactFooter: 'Contact',
        aboutBottomLink: 'About us',
        applyBtn: 'Apply to work',
    },  

        // index

    NO: {
        exploreLink: 'Utforsk',
        reviewsLink: 'Vurderinger',
        aboutLink: 'Om oss',
        contactLink: 'Kontakt',
        bergen: 'Bergen',
        heroText: 'Velg din drømmetur og opplev skjulte perler, og det beste Bergen har å tilby.',
        destinationSearch: 'Søk etter destinasjon...',
        trollskogenInfo: '',

        // about

        overAbout: 'Om Gems of Bergen: Din inngangsport til Bergen',
        aboutHeroContent: 'Velkommen til Gems of Bergen, ditt ultimate reisemål for å oppdage de beste skjulte perlene i Bergen! Vi er et ungdomsdrevet selskap opprettet av lidenskapelige tenåringer som ønsker å gi deg den beste opplevelsen mulig. Våre spesialiserte turer er designet for folk i alle aldre og interesser, og tilbyr unike opplevelser skreddersydd etter hva du ønsker å utforske.',
        overMission: 'Vår misjon og kjerneverdier',
        overMission1: 'Viser frem det beste av Bergen',
        overMission2: 'Støtte',
        missionContent1: 'Vårt primære mål er å gjøre din reise gjennom Bergen så rik og komfortabel som mulig. Vi fokuserer på kvaliteten på rutene våre, sikkerhet og bærekraften til turene våre, og sikrer at hvert eventyr ikke bare er spennende, men også ansvarlig.',
        missionContent2: 'Når du velger Gems of Bergen, støtter du også unge mennesker i deres aller første jobb. Vi gir ungdom muligheten til å få reell arbeidserfaring mens de praktiserer fremmedspråk på en meningsfull måte.',
        missionContent3: ' Så når du blir med på en tur med Gems of Bergen, oppdager du ikke bare den lokale siden av Bergen med entusiastiske guider — du hjelper også med å støtte en bevegelse som gir unge mennesker deres første steg inn i arbeidslivet.',
        teamText: 'Møt vårt dedikerte team',
        callToActionText: 'Klar til å starte ditt eventyr?',
        callToActionBtn: 'Utforsk turer',
        ContactFooter: 'Kontakt',
        aboutBottomLink: 'Om oss',
        applyBtn: 'Søk om jobb',
    }
};

function applyLanguage(lang) {
    const t = texts[lang];
    if (!t) return;

    const exploreLink = document.getElementById('explore-link');
    if (exploreLink) exploreLink.textContent = t.exploreLink;

    const reviewsLink = document.getElementById('reviews-link');
    if (reviewsLink) reviewsLink.textContent = t.reviewsLink;

    const aboutLink = document.getElementById('about-link');
    if (aboutLink) aboutLink.textContent = t.aboutLink;

    const contactLink = document.getElementById('contact-link');
    if (contactLink) contactLink.textContent = t.contactLink;

    const bergen = document.getElementById('bergen');
    if (bergen) bergen.textContent = t.bergen;

    const heroText = document.querySelector('.hero-text p');
    if (heroText) heroText.textContent = t.heroText;

    const destinationSearch = document.getElementById('destination-search');
    if (destinationSearch) destinationSearch.placeholder = t.destinationSearch;

    const overAbout = document.getElementById('over-about');
    if (overAbout) overAbout.textContent = t.overAbout;

    const aboutHeroContent = document.querySelector('.about-hero-content p');
    if (aboutHeroContent) aboutHeroContent.textContent = t.aboutHeroContent;

    const overMission = document.getElementById('over-mission');
    if (overMission) overMission.textContent = t.overMission;

    const overMission1 = document.getElementById('over-mission1');
    if (overMission1) overMission1.textContent = t.overMission1;

    const overMission2 = document.getElementById('over-mission2');
    if (overMission2) overMission2.textContent = t.overMission2;

    const missionContent1 = document.getElementById('mission-content1');
    if (missionContent1) missionContent1.textContent = t.missionContent1;

    const missionContent2 = document.getElementById('mission-content2');
    if (missionContent2) missionContent2.textContent = t.missionContent2;

    const missionContent3 = document.getElementById('mission-content3');
    if (missionContent3) missionContent3.textContent = t.missionContent3;

    const teamText = document.getElementById('team-text');
    if (teamText) teamText.textContent = t.teamText;

    const callToActionText = document.getElementById('call-to-action-text');
    if (callToActionText) callToActionText.textContent = t.callToActionText;

    const callToActionBtn = document.getElementById('call-to-action-btn');
    if (callToActionBtn) callToActionBtn.textContent = t.callToActionBtn;

    const ContactFooter = document.getElementById('ContactFooter');
    if (ContactFooter) ContactFooter.textContent = t.ContactFooter;

    const aboutBottomLink = document.getElementById('about-bottom-link');
    if (aboutBottomLink) aboutBottomLink.textContent = t.aboutBottomLink;

    const applyBtn = document.getElementById('apply-btn');
    if (applyBtn) applyBtn.textContent = t.applyBtn;

    localStorage.setItem("lang", lang);

    // const navCenter = document.querySelector(".nav-center");

    // if(lang === "NO"){
    //     navCenter.classList.add("shift-no");
    // } else {
    //     navCenter.classList.remove("shift-no");
    // }
}

if (langSelect) {
    langSelect.addEventListener('change', () => {
        const selectedLang = langSelect.value.toUpperCase();
        applyLanguage(selectedLang);
    });
}

  const savedLang = localStorage.getItem('lang') || 'EN';
  if (langSelect) langSelect.value = savedLang;
  applyLanguage(savedLang);
});