export interface ProjectImage {
  id: string
  src: string
  alt: string
  projectSlug: string
  featured?: boolean
  order?: number
  type?: "image" | "video"
  caption?: string
  description?: string
  thumbnailSrc?: string
  detailSrc?: string
  lightboxSrc?: string
}

// Legacy seed and CMS-free fallback media. Production project records live in Payload.
export const projectImages: ProjectImage[] = [
  // Siglo Sky Lounge images
  {
    id: "siglo-1",
    src: "/projects/siglo-sky-lounge/siglo1_DSC06541.webp",
    alt: "Group of women enjoying social time at Siglo Sky Lounge rooftop terrace with round wooden table and lush greenery",
    projectSlug: "siglo-sky-lounge",
    featured: true,
    order: 1,
    type: "image",
    caption: "Rooftop Social Experience",
    description:
      "Creating memorable moments at Siglo Sky Lounge's premium rooftop terrace, showcasing the venue's appeal for social gatherings and networking events.",
  },
  {
    id: "siglo-2",
    src: "/projects/siglo-sky-lounge/siglo2_DSC06684.webp",
    alt: "Two women in elegant dresses posing in front of Siglo Sky Lounge building during daytime with modern architecture",
    projectSlug: "siglo-sky-lounge",
    order: 2,
    type: "image",
    caption: "Elegant Venue Branding",
    description:
      "Professional lifestyle photography highlighting Siglo Sky Lounge's sophisticated atmosphere and architectural appeal for upscale clientele.",
  },
  {
    id: "siglo-3",
    src: "/projects/siglo-sky-lounge/siglo3_DSC06770.webp",
    alt: "DJ in patterned shirt performing behind Siglo Sky Lounge branded booth with large windows and greenery background",
    projectSlug: "siglo-sky-lounge",
    order: 3,
    type: "image",
    caption: "Entertainment & Events",
    description:
      "Capturing the dynamic entertainment offerings that position Siglo Sky Lounge as a premier destination for nightlife and special events.",
  },
  {
    id: "siglo-4",
    src: "/projects/siglo-sky-lounge/siglo4_KIO08059.webp",
    alt: "Event hosts with microphones at Siglo Sky Lounge during nighttime with illuminated signage in background",
    projectSlug: "siglo-sky-lounge",
    order: 4,
    type: "image",
    caption: "Professional Event Hosting",
    description:
      "Documenting the venue's capacity for professional events and corporate functions, emphasizing quality service and ambiance.",
  },

  // Kinta Coffee images
  {
    id: "kinta-1",
    src: "/projects/kinta/kinta-project-image-1.webp",
    alt: "Woman in red floral top holding an orange card with Kinta Coffee branding",
    projectSlug: "kinta",
    featured: true,
    order: 1,
    type: "image",
    caption: "Brand Identity Integration",
    description:
      "Strategic brand positioning through lifestyle photography that connects Kinta Coffee's visual identity with target customer demographics.",
  },
  {
    id: "kinta-2",
    src: "/projects/kinta/kinta-project-image-2.webp",
    alt: "Woman laughing while enjoying a coffee drink at Kinta Coffee",
    projectSlug: "kinta",
    order: 2,
    type: "image",
    caption: "Authentic Customer Experience",
    description:
      "Capturing genuine moments of customer satisfaction to build emotional connections and reinforce brand authenticity in social media campaigns.",
  },
  {
    id: "kinta-3",
    src: "/projects/kinta/kinta-project-image-3.webp",
    alt: "Specialty layered coffee drink from Kinta Coffee",
    projectSlug: "kinta",
    featured: true,
    order: 3,
    type: "image",
    caption: "Product Excellence Showcase",
    description:
      "Professional product photography highlighting Kinta Coffee's specialty beverages and artisanal quality to drive customer interest and sales.",
  },
  {
    id: "kinta-4",
    src: "/projects/kinta/kinta-project-image-4.webp",
    alt: "Interior of Kinta Coffee shop with customers enjoying their drinks",
    projectSlug: "kinta",
    order: 4,
    type: "image",
    caption: "Atmosphere & Community",
    description:
      "Environmental photography showcasing the welcoming atmosphere and community aspect that differentiates Kinta Coffee from competitors.",
  },

  // Loka Gym and Restaurant images
  {
    id: "loka-1",
    src: "/projects/loka/loka-project-image-6.webp",
    alt: "Man with boxing gloves at Loka Gym with #MEETLOKAMATES branding",
    projectSlug: "loka",
    featured: true,
    order: 1,
    type: "image",
    caption: "Fitness Community Branding",
    description:
      "Strategic hashtag integration and community building through authentic fitness photography that increased membership engagement by 50%.",
  },
  {
    id: "loka-2",
    src: "/projects/loka/loka-project-image-2.webp",
    alt: "Woman working out on fitness equipment at Loka Gym",
    projectSlug: "loka",
    order: 2,
    type: "image",
    caption: "Inclusive Fitness Environment",
    description:
      "Showcasing Loka's welcoming environment for all fitness levels, supporting the integrated wellness positioning strategy.",
  },
  {
    id: "loka-3",
    src: "/projects/loka/loka-project-image-4.webp",
    alt: "Friends enjoying healthy food at Loka Restaurant",
    projectSlug: "loka",
    featured: true,
    order: 3,
    type: "image",
    caption: "Nutrition & Social Connection",
    description:
      "Demonstrating the seamless integration between fitness and nutrition offerings that drove 65% cross-utilization between gym and restaurant.",
  },
  {
    id: "loka-4",
    src: "/projects/loka/loka-project-image-10.webp",
    alt: "Close-up of Loka branded tank top with person preparing for boxing training",
    projectSlug: "loka",
    order: 4,
    type: "image",
    caption: "Brand Merchandise & Identity",
    description:
      "Product placement and brand identity reinforcement through lifestyle photography that strengthened brand recognition and loyalty.",
  },

  // Balakosa Coffee images
  {
    id: "balakosa-1",
    src: "/projects/balakosa-coffee/balakosa-project-image-1.webp",
    alt: "Balakosa Coffee cup with branded logo on a table",
    projectSlug: "balakosa-coffee",
    featured: true,
    order: 1,
    type: "image",
    caption: "Brand Recognition Strategy",
    description:
      "Clean product photography that established consistent brand recognition across social media platforms, contributing to 60% engagement increase.",
  },
  {
    id: "balakosa-2",
    src: "/projects/balakosa-coffee/balakosa-project-image-2.webp",
    alt: "Balakosa Coffee latte art and book on grass",
    projectSlug: "balakosa-coffee",
    featured: true,
    order: 2,
    type: "image",
    caption: "Lifestyle Integration",
    description:
      "Artistic lifestyle photography connecting coffee culture with daily activities, supporting the brand's positioning in Yogyakarta's competitive market.",
  },
  {
    id: "balakosa-3",
    src: "/projects/balakosa-coffee/balakosa-project-image-3.webp",
    alt: "Woman reading a book while enjoying Balakosa Coffee in outdoor setting",
    projectSlug: "balakosa-coffee",
    order: 3,
    type: "image",
    caption: "Target Audience Connection",
    description:
      "Strategic customer photography that resonated with target demographics, helping achieve 40% improvement in campaign ROI.",
  },
  {
    id: "balakosa-4",
    src: "/projects/balakosa-coffee/balakosa-project-image-4.webp",
    alt: "Customer working on laptop at Balakosa Coffee shop",
    projectSlug: "balakosa-coffee",
    order: 4,
    type: "image",
    caption: "Workspace & Productivity",
    description:
      "Environmental photography showcasing Balakosa as a productive workspace, attracting remote workers and students to increase in-store traffic by 60%.",
  },

  // Gubernatorial Campaign images (Iqbal-Dinda Campaign)
  {
    id: "iqbal-dinda-1",
    src: "/projects/iqbal-dinda-campaign/gubernatorial-campaign-featured.webp",
    alt: "Gubernatorial candidate in traditional white clothing and black cap waving to supporters",
    projectSlug: "iqbal-dinda-campaign",
    featured: true,
    order: 1,
    type: "image",
    caption: "Authentic Leadership Imagery",
    description:
      "Strategic campaign photography that connected regional identity with leadership qualities, contributing to electoral victory and 80% improvement in campaign engagement.",
  },
  {
    id: "iqbal-dinda-2",
    src: "/projects/iqbal-dinda-campaign/gubernatorial-campaign-black.webp",
    alt: "Professional portrait of gubernatorial candidate in a suit with thoughtful expression",
    projectSlug: "iqbal-dinda-campaign",
    order: 2,
    type: "image",
    caption: "Professional Authority",
    description:
      "Formal portrait photography establishing credibility and professional competence for diverse voter demographics across West Nusa Tenggara.",
  },
  {
    id: "iqbal-dinda-3",
    src: "/projects/iqbal-dinda-campaign/gubernatorial-campaign-KIO08456.webp",
    alt: "Gubernatorial candidate in orange shirt with a bicycle, representing grassroots campaign approach",
    projectSlug: "iqbal-dinda-campaign",
    order: 3,
    type: "image",
    caption: "Grassroots Connection",
    description:
      "Lifestyle campaign photography demonstrating accessibility and connection to everyday voters, supporting the authentic narrative development strategy.",
  },
  {
    id: "iqbal-dinda-4",
    src: "/projects/iqbal-dinda-campaign/iqbaldinda_DSC09059.webp",
    alt: "Gubernatorial candidate in white traditional clothing and yellow cap greeting a supporter in orange traditional attire",
    projectSlug: "iqbal-dinda-campaign",
    order: 4,
    type: "image",
    caption: "Cultural Integration",
    description:
      "Strategic cultural photography that honored regional identity while communicating the candidates' vision, making them the #1 top-of-mind choice.",
  },

  // Hotel Ombak Sunset images
  {
    id: "hotel-1",
    src: "/projects/hotel/ombaksunset-featured.webp",
    alt: "Exterior view of Hotel Ombak Sunset with traditional Indonesian architecture at dusk",
    projectSlug: "hotel",
    featured: true,
    order: 1,
    type: "image",
    caption: "Signature Golden Hour Branding",
    description:
      "Architectural photography capturing the hotel's unique sunset positioning, establishing the visual consistency that increased engagement by 40%.",
  },
  {
    id: "hotel-2",
    src: "/projects/hotel/ombaksunset-menu-4.webp",
    alt: "Gourmet mini burgers and potato wedges from Hotel Ombak Sunset's Indian menu",
    projectSlug: "hotel",
    order: 2,
    type: "image",
    caption: "Culinary Excellence",
    description:
      "Professional food photography showcasing the hotel's dining offerings, supporting the experience-first storytelling approach that drove direct bookings.",
  },
  {
    id: "hotel-3",
    src: "/projects/hotel/ombaksunset-room50.webp",
    alt: "Couple in robes enjoying cocktails on a bed at Hotel Ombak Sunset",
    projectSlug: "hotel",
    order: 3,
    type: "image",
    caption: "Luxury Experience Moments",
    description:
      "Lifestyle photography creating shareable moments that encouraged user-generated content and expanded organic reach through authentic guest experiences.",
  },
  {
    id: "hotel-4",
    src: "/projects/hotel/ombaksunset-spa-16.webp",
    alt: "Four spa staff members at Hotel Ombak Sunset in traditional greeting pose in front of ornate wooden doors",
    projectSlug: "hotel",
    order: 4,
    type: "image",
    caption: "Cultural Authenticity",
    description:
      "Staff and service photography highlighting local cultural integration, appealing to travelers seeking authentic Indonesian hospitality experiences.",
  },

  // Royal Batu Bolong images
  {
    id: "royal-batu-1",
    src: "/projects/royal-batu-bolong/royal-batu-featured-building.webp",
    alt: "Unique architectural structure with wavy roof at Royal Batu Bolong wedding venue",
    projectSlug: "royal-batu-bolong",
    featured: true,
    order: 1,
    type: "image",
    caption: "Distinctive Architecture",
    description:
      "Architectural photography highlighting the venue's unique design features that differentiated Royal Batu Bolong in the competitive wedding market.",
  },
  {
    id: "royal-batu-2",
    src: "/projects/royal-batu-bolong/royal-batu-woman.webp",
    alt: "Close-up of a bride in an elegant wedding dress at Royal Batu Bolong",
    projectSlug: "royal-batu-bolong",
    order: 2,
    type: "image",
    caption: "Wedding Venue Positioning",
    description:
      "Bridal photography that transformed brand positioning to highlight wedding venue capabilities, achieving 30% increase in brand engagement.",
  },
  {
    id: "royal-batu-3",
    src: "/projects/royal-batu-bolong/royal-batu-aestheticwoman.webp",
    alt: "Artistic blurred image of a bride in a wedding dress at Royal Batu Bolong",
    projectSlug: "royal-batu-bolong",
    order: 3,
    type: "image",
    caption: "Artistic Wedding Photography",
    description:
      "Creative photography techniques that established Royal Batu Bolong's reputation for sophisticated wedding photography and memorable experiences.",
  },
  {
    id: "royal-batu-4",
    src: "/projects/royal-batu-bolong/royal-batu-DSC03658-Enhanced-NR.webp",
    alt: "Architectural structure with curved roof and a tree at Royal Batu Bolong with ocean view",
    projectSlug: "royal-batu-bolong",
    order: 4,
    type: "image",
    caption: "Scenic Location Advantage",
    description:
      "Environmental photography showcasing the venue's natural beauty and ocean views, supporting targeted awareness campaigns for destination weddings.",
  },

  // House of Representatives Campaign (Busfi Arusagara) images
  {
    id: "busfi-1",
    src: "/projects/busfi-arusagara-campaign/dpr-image-featured.webp",
    alt: "Portrait of Busfi Arusagara wearing a yellow party vest with green emblem and glasses",
    projectSlug: "busfi-arusagara-campaign",
    featured: true,
    order: 1,
    type: "image",
    caption: "Political Brand Identity",
    description:
      "Professional political portrait establishing distinctive personal brand identity that increased candidate visibility by 80% through strategic social media engagement.",
  },
  {
    id: "busfi-2",
    src: "/projects/busfi-arusagara-campaign/dpr-image-1.webp",
    alt: "Busfi Arusagara in yellow shirt having a discussion with a supporter over coffee",
    projectSlug: "busfi-arusagara-campaign",
    order: 2,
    type: "image",
    caption: "Constituent Engagement",
    description:
      "Candid campaign photography demonstrating authentic connections with constituents, supporting the comprehensive social media strategy for voter outreach.",
  },
  {
    id: "busfi-3",
    src: "/projects/busfi-arusagara-campaign/dpr-image-3.webp",
    alt: "Busfi Arusagara in black jacket and yellow shirt having an animated conversation at a cafe with colorful tiled counter",
    projectSlug: "busfi-arusagara-campaign",
    order: 3,
    type: "image",
    caption: "Accessible Leadership",
    description:
      "Environmental campaign photography showing the candidate in everyday settings, reinforcing accessibility and connection with target voter segments.",
  },
  {
    id: "busfi-4",
    src: "/projects/busfi-arusagara-campaign/busfi.webp",
    alt: "Busfi Arusagara in black jacket with number 4 laughing with a supporter at a campaign event",
    projectSlug: "busfi-arusagara-campaign",
    order: 4,
    type: "image",
    caption: "Campaign Momentum",
    description:
      "Event photography capturing positive campaign energy and supporter enthusiasm, contributing to enhanced voter connection and brand recognition.",
  },

  // Resto Kenangan Restaurant images
  {
    id: "resto-kenangan-1",
    src: "/projects/resto-kenangan/restokenangan-featured.webp",
    alt: "Person taking a photo of a woman eating at Resto Kenangan restaurant with decorative lattice background",
    projectSlug: "resto-kenangan",
    featured: true,
    order: 1,
    type: "image",
    caption: "Social Media Moments",
    description:
      "Strategic photography creating Instagram-worthy moments that encouraged user-generated content, contributing to 30% increase in customer traffic.",
  },
  {
    id: "resto-kenangan-2",
    src: "/projects/resto-kenangan/restokenangan-SON04033.webp",
    alt: "Close-up of fried chicken dish with vegetables and orange dipping sauce at Resto Kenangan",
    projectSlug: "resto-kenangan",
    order: 2,
    type: "image",
    caption: "Signature Dish Showcase",
    description:
      "Professional food photography highlighting the restaurant's unique culinary story and signature dishes that differentiated the brand in the competitive market.",
  },
  {
    id: "resto-kenangan-3",
    src: "/projects/resto-kenangan/restokenangan-KIO01438.webp",
    alt: "Group of friends enjoying food and colorful drinks at Resto Kenangan restaurant",
    projectSlug: "resto-kenangan",
    order: 3,
    type: "image",
    caption: "Social Dining Experience",
    description:
      "Group dining photography that reinforced the restaurant's positioning as a social destination, supporting targeted social media campaigns.",
  },
  {
    id: "resto-kenangan-4",
    src: "/projects/resto-kenangan/resto-kenangan-2th-ambiance.webp",
    alt: "Resto Kenangan mascot with traditional batik cap and mustache standing in front of the restaurant during anniversary celebration",
    projectSlug: "resto-kenangan",
    order: 4,
    type: "image",
    caption: "Brand Character Development",
    description:
      "Mascot and brand character photography that created emotional connections with diners, strengthening customer loyalty and brand identity.",
  },

  // Switch On Creative images
  {
    id: "switch-on-1",
    src: "/projects/switch-on-creative/output.gif",
    lightboxSrc: "/project-media/switch-on-creative/output-motion.webp",
    alt: "Professional portrait of a business executive in a suit with thoughtful expression",
    projectSlug: "switch-on-creative",
    featured: true,
    order: 1,
    type: "video",
    caption: "Executive Portrait Animation",
    description:
      "Creative motion graphics showcasing professional portrait work that contributed to 70% increase in brand engagement through innovative presentation techniques.",
  },
  // Additional Switch On Creative images (using creative work examples)
  {
    id: "switch-on-2",
    src: "/projects/kinta/kinta-project-image-1.webp",
    alt: "Creative marketing materials showing woman in red floral top holding an orange card",
    projectSlug: "switch-on-creative",
    order: 2,
    type: "image",
    caption: "Brand Identity Campaigns",
    description:
      "Strategic creative direction for client brand campaigns, demonstrating the comprehensive creative strategies that improved content production efficiency by 90%.",
  },
  {
    id: "switch-on-3",
    src: "/projects/loka/loka-project-image-6.webp",
    alt: "Creative campaign for fitness brand showing man with boxing gloves and branded hashtag",
    projectSlug: "switch-on-creative",
    order: 3,
    type: "image",
    caption: "Fitness Brand Strategy",
    description:
      "Cross-functional creative team collaboration resulting in compelling fitness brand campaigns with clear strategic rationales and 100% first-round approvals.",
  },
  {
    id: "switch-on-4",
    src: "/projects/balakosa-coffee/balakosa-project-image-1.webp",
    alt: "Creative product photography for coffee brand showing branded cup on wooden table",
    projectSlug: "switch-on-creative",
    order: 4,
    type: "image",
    caption: "Product Photography Direction",
    description:
      "Creative direction for product photography that maintained 75% stronger brand consistency through detailed brand voice guidelines and creative direction documents.",
  },

  // Paragliding Accuracy World Cup (PGAWC) 2025 images
  {
    id: "pgawc-1",
    src: "/projects/paragliding-accuracy-world-cup-2025/pgawc_DSC00247.webp",
    alt: "Paraglider with orange and yellow canopy flying over Lombok's coastal landscape with Bank NTB Syariah banner during PGAWC 2025",
    projectSlug: "paragliding-accuracy-world-cup-2025",
    featured: true,
    order: 1,
    type: "image",
    caption: "International Competition Coverage",
    description:
      "Dynamic sports photography capturing the excitement of international paragliding competition, contributing to 95% attendee satisfaction rating through comprehensive event documentation.",
  },
  {
    id: "pgawc-2",
    src: "/projects/paragliding-accuracy-world-cup-2025/pgawc_DSC00294.webp",
    alt: "Traditional Indonesian cultural performance with colorful costumes and decorations during PGAWC opening ceremony with paragliders in the sky",
    projectSlug: "paragliding-accuracy-world-cup-2025",
    order: 2,
    type: "image",
    caption: "Cultural Integration",
    description:
      "Opening ceremony photography blending international sports with local culture, showcasing the creative concept development that enhanced the overall event experience.",
  },
  {
    id: "pgawc-3",
    src: "/projects/paragliding-accuracy-world-cup-2025/pgawc_DSC00490.webp",
    alt: "Spectacular aerial view of multiple paragliders competing in the sky over Lombok's green hills and coastal landscape",
    projectSlug: "paragliding-accuracy-world-cup-2025",
    order: 3,
    type: "image",
    caption: "Competitive Action",
    description:
      "Aerial competition photography that amplified global online presence through compelling visual storytelling and strategic digital campaign execution.",
  },
  {
    id: "pgawc-4",
    src: "/projects/paragliding-accuracy-world-cup-2025/pgawc_DSC09999.webp",
    alt: "PGAWC 2025 opening ceremony with international flags, stage setup, and audience in white chairs with traditional decorations",
    projectSlug: "paragliding-accuracy-world-cup-2025",
    order: 4,
    type: "image",
    caption: "Ceremony Production",
    description:
      "Event production photography documenting the meticulous planning and execution that resulted in seamless delivery and positive global media coverage.",
  },

  // Hikayat Ampenan images
  {
    id: "hikayat-1",
    src: "/projects/hikayat-ampenan/hikayat_DSC06917.webp",
    alt: "Multimedia performance with three performers on stage and projected historical imagery for Hikayat Ampenan documentary presentation",
    projectSlug: "hikayat-ampenan",
    featured: true,
    order: 1,
    type: "image",
    caption: "Documentary Cinematography",
    description:
      "Cinematic documentation of cultural storytelling performance, showcasing the advanced camera and lighting techniques used to bring Ampenan's history to life.",
  },
  {
    id: "hikayat-2",
    src: "/projects/hikayat-ampenan/hikayat_DSC07059.webp",
    alt: "Two performers in black clothing against textured wall with dramatic lighting during Hikayat Ampenan cultural performance",
    projectSlug: "hikayat-ampenan",
    order: 2,
    type: "image",
    caption: "Dramatic Visual Narrative",
    description:
      "Artistic performance photography demonstrating the distinct visual style developed for the documentary, creating a compelling visual narrative for cultural preservation.",
  },
  {
    id: "hikayat-3",
    src: "/projects/hikayat-ampenan/hikayat_DSC07027.webp",
    alt: "Dramatic theatrical scene with blue lighting showing performer on stage with silhouettes in background from Hikayat Ampenan",
    projectSlug: "hikayat-ampenan",
    order: 3,
    type: "image",
    caption: "Theatrical Documentation",
    description:
      "Stage photography capturing the emotional depth of historical storytelling, supporting the Ministry of Education and Culture's cultural preservation objectives.",
  },
  {
    id: "hikayat-4",
    src: "/projects/hikayat-ampenan/hikayat_DSC06873.webp",
    alt: "Cultural event presentation with speaker at microphone and traditional Indonesian musicians in background for Hikayat Ampenan documentary",
    projectSlug: "hikayat-ampenan",
    order: 4,
    type: "image",
    caption: "Cultural Heritage Preservation",
    description:
      "Documentary photography creating a valuable historical record for future generations, demonstrating the power of visual storytelling in cultural preservation.",
  },

  // SMCP images
  {
    id: "smcp-1",
    src: "/projects/smcp/smcp_DSC08655.webp",
    alt: "Display of various company logos including SMCP Sumber Makmur on a patterned background",
    projectSlug: "smcp",
    featured: true,
    order: 1,
    type: "image",
    caption: "Corporate Brand Portfolio",
    description:
      "Corporate branding photography showcasing the comprehensive social media operations that generated 20% ROI through strategic content calendars.",
  },
  {
    id: "smcp-2",
    src: "/projects/smcp/smcp_DSC04748.webp",
    alt: "Woman in yellow hijab and outfit smiling on a staircase at SMCP office",
    projectSlug: "smcp",
    order: 2,
    type: "image",
    caption: "Employee Brand Ambassadors",
    description:
      "Corporate lifestyle photography that enhanced brand positioning and increased brand awareness through authentic employee representation and community management.",
  },
  {
    id: "smcp-3",
    src: "/projects/smcp/smcp_DSC03688.webp",
    alt: "Exterior of PT Sumber Makmur Cemerlang Persada building with colorful signage and branding",
    projectSlug: "smcp",
    order: 3,
    type: "image",
    caption: "Corporate Identity",
    description:
      "Architectural corporate photography establishing distinctive brand voice and positioning in the competitive market through comprehensive content planning.",
  },
  {
    id: "smcp-4",
    src: "/projects/smcp/smcp_DSC08687.webp",
    alt: "Exhibition sign showing SMCP Sumber Makmur as a sponsor alongside other companies",
    projectSlug: "smcp",
    order: 4,
    type: "image",
    caption: "Partnership & Sponsorship",
    description:
      "Event sponsorship photography demonstrating the company's market presence and strategic partnerships, supporting improved engagement metrics across platforms.",
  },

  // FORNAS VIII NTB 2025 images
  {
    id: "fornas-1",
    src: "/projects/fornas-viii-ntb-2025/fornas_DSC03212.webp",
    alt: "FORNAS VIII opening ceremony with performers in white uniforms holding flags on stage in Bengkulu",
    projectSlug: "fornas-viii-ntb-2025",
    featured: true,
    order: 1,
    type: "image",
    caption: "National Sports Festival Opening",
    description:
      "Ceremonial photography documenting the digital strategy that managed seamless information flow for over 25,000 participants and engaged a national audience of 15,000+.",
  },
  {
    id: "fornas-2",
    src: "/projects/fornas-viii-ntb-2025/fornas_DSC02296.webp",
    alt: "Group photo of officials and dignitaries at FORNAS VIII NTB 2025 event with event branding",
    projectSlug: "fornas-viii-ntb-2025",
    order: 2,
    type: "image",
    caption: "Official Delegation Coverage",
    description:
      "VIP and delegation photography supporting the comprehensive digital strategy that resulted in 40% increase in social media engagement across all platforms.",
  },
  {
    id: "fornas-3",
    src: "/projects/fornas-viii-ntb-2025/fornas_DSC07799.webp",
    alt: "FORNAS VIII mascot deer character in traditional Indonesian clothing waving at Mandalika venue",
    projectSlug: "fornas-viii-ntb-2025",
    order: 3,
    type: "image",
    caption: "Brand Character Development",
    description:
      "Mascot and brand photography that built a vibrant online community and created engaging content for real-time updates and interactive social media campaigns.",
  },
  {
    id: "fornas-4",
    src: "/projects/fornas-viii-ntb-2025/fornas_DSC01607.webp",
    alt: "Athletes running in indoor sports venue during FORNAS VIII with event banners visible",
    projectSlug: "fornas-viii-ntb-2025",
    order: 4,
    type: "image",
    caption: "Athletic Competition Documentation",
    description:
      "Sports action photography providing dynamic content for the integrated social media campaign and mobile communication strategy that reached nationwide audiences.",
  },

  // Explore Lombok images
  {
    id: "explore-lombok-1",
    src: "/projects/explore-lombok/explore_lombok_PESIAR_CIRCUIT.webp",
    alt: "Two motorcyclists at Pertamina Mandalika International Circuit during Explore Lombok media project",
    projectSlug: "explore-lombok",
    featured: true,
    order: 1,
    type: "image",
    caption: "Tourism Media Production",
    description:
      "Adventure tourism photography supporting the targeted media projects and content series that drove 25% business growth during critical seasonal operations.",
  },
  {
    id: "explore-lombok-2",
    src: "/projects/explore-lombok/explore_lombok_KIO02580.webp",
    alt: "Traditional cultural performance with large crowd during Explore Lombok cultural documentation",
    projectSlug: "explore-lombok",
    order: 2,
    type: "image",
    caption: "Cultural Event Documentation",
    description:
      "Large-scale event photography showcasing Lombok's cultural richness, contributing to the expanded media portfolio and enhanced market position.",
  },
  {
    id: "explore-lombok-3",
    src: "/projects/explore-lombok/explore_lombok_DSC01329.webp",
    alt: "Wide view of Mandalika International Circuit race track with colorful grandstands and hills in background",
    projectSlug: "explore-lombok",
    order: 3,
    type: "image",
    caption: "Infrastructure & Development",
    description:
      "Architectural and infrastructure photography highlighting Lombok's modern facilities, supporting strategic business development and new partnership acquisition.",
  },
  {
    id: "explore-lombok-4",
    src: "/projects/explore-lombok/explore_lombok_IDUL_ADHA_14.webp",
    alt: "Goats in wooden pens during Idul Adha celebrations as part of Explore Lombok cultural content series",
    projectSlug: "explore-lombok",
    order: 4,
    type: "image",
    caption: "Religious & Cultural Traditions",
    description:
      "Cultural documentation photography for content series that showcased authentic Lombok experiences, improving operational efficiency and client acquisition.",
  },
  {
    id: "explore-lombok-5",
    src: "/projects/explore-lombok/explore_lombok_IDUL_ADHA_23.webp",
    alt: "Portrait of local man in white traditional clothing and cap during Idul Adha documentation",
    projectSlug: "explore-lombok",
    order: 5,
    type: "image",
    caption: "Local Community Portraits",
    description:
      "Portrait photography celebrating local community members, supporting the authentic storytelling approach that enhanced the company's reputation and market position.",
  },
  {
    id: "explore-lombok-6",
    src: "/projects/explore-lombok/explore_lombok_MBC_42.webp",
    alt: "Local vendor giving thumbs up at market stall showcasing Lombok's local culture and commerce",
    projectSlug: "explore-lombok",
    order: 6,
    type: "image",
    caption: "Local Business & Commerce",
    description:
      "Commercial photography highlighting local entrepreneurship and commerce, supporting the strategic leadership that achieved substantial revenue growth in seasonal market.",
  },

  // AMOK Research images
  {
    id: "amok-1",
    src: "/projects/amok-research/amok_spicy_lombok_preview_4.webp",
    alt: "Simple graphic design with flower, pineapple, and chili icons representing Spicy Lombok branding elements",
    projectSlug: "amok-research",
    featured: true,
    order: 1,
    type: "image",
    caption: "Brand Identity Development",
    description:
      "Graphic design work showcasing the new support workflow development that improved operational efficiency by 15% for the consulting and research divisions.",
  },
  {
    id: "amok-2",
    src: "/projects/amok-research/amok_spicy_lombok_preview_3.webp",
    alt: "Moodboard showcasing spicy food branding elements including PICANTE, GOOD STORE, chili peppers, and restaurant concepts",
    projectSlug: "amok-research",
    order: 2,
    type: "image",
    caption: "Creative Concept Development",
    description:
      "Design moodboard demonstrating the streamlined workflow and process redesign that enhanced delivery of client projects through improved cross-divisional collaboration.",
  },
  {
    id: "amok-3",
    src: "/projects/amok-research/amok_spicy_lombok_preview_12.webp",
    alt: "Product design concepts showing two different coffee cup branding and packaging approaches",
    projectSlug: "amok-research",
    order: 3,
    type: "image",
    caption: "Product Design Solutions",
    description:
      "Product design concepts reflecting the technology integration and automation tools implemented to support the new workflow and reduce manual tasks.",
  },
  {
    id: "amok-4",
    src: "/projects/amok-research/amok_spicy_lombok_preview_11.webp",
    alt: "Colorful beverage bottle lineup in red, orange, yellow, and green with consistent branding design",
    projectSlug: "amok-research",
    order: 4,
    type: "image",
    caption: "Brand Consistency Systems",
    description:
      "Brand system design demonstrating the systematic approach to process improvement that achieved significant gains in productivity and enhanced overall work quality.",
  },

  // World Field Archery (IWFA) 2025 images
  {
    id: "iwfa-1",
    src: "/projects/world-field-archery-2025/iwfa_IMG_7117.webp",
    alt: "Large group photo of World Field Archery participants and officials in outdoor setting with lush green hills",
    projectSlug: "world-field-archery-2025",
    featured: true,
    order: 1,
    type: "image",
    caption: "International Delegation",
    description:
      "Group photography documenting the complete planning and execution of opening and closing ceremonies that achieved 95% attendee satisfaction rating for the international competition.",
  },
  {
    id: "iwfa-2",
    src: "/projects/world-field-archery-2025/iwfa_DSC08580.webp",
    alt: "Archer in pink and black uniform drawing traditional wooden bow during IWFA competition with traditional building in background",
    projectSlug: "world-field-archery-2025",
    order: 2,
    type: "image",
    caption: "Traditional Archery Competition",
    description:
      "Competition photography showcasing the unique theme development that celebrated both the sport of archery and the host location's heritage through integrated digital marketing.",
  },
  {
    id: "iwfa-3",
    src: "/projects/world-field-archery-2025/iwfa_DSC08636.webp",
    alt: "Two archers competing, one in red headband with traditional wooden bow, another in patterned shirt in forest setting",
    projectSlug: "world-field-archery-2025",
    order: 3,
    type: "image",
    caption: "Forest Competition Setting",
    description:
      "Environmental sports photography demonstrating the collaborative planning and risk management that ensured seamless event delivery without major issues.",
  },
  {
    id: "iwfa-4",
    src: "/projects/world-field-archery-2025/iwfa_DSC08650.webp",
    alt: "Close-up of archer's hands holding smartphone displaying archery scoring app with target diagram during competition",
    projectSlug: "world-field-archery-2025",
    order: 4,
    type: "image",
    caption: "Digital Integration",
    description:
      "Technology documentation showing the digital content creation and live event management that amplified online presence and generated global buzz for the international event.",
  },
]
