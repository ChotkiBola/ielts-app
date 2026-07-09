export const LISTENING_SETS = [
  {
    id: "l1",
    title: "Part 1 — Booking a Community Centre Room",
    minutes: 10,
    audioUrl: null, // TODO: generate via TTS and store in Supabase, same pattern as speaking-audio
    transcript:
      "Woman: Good morning, Riverside Community Centre, how can I help?\n" +
      "Man: Hi, I'd like to book a room for a small workshop next month.\n" +
      "Woman: Sure — can I take your name first?\n" +
      "Man: It's Daniel Whitfield. That's W-H-I-T-F-I-E-L-D.\n" +
      "Woman: Thanks, Daniel. And what date were you thinking?\n" +
      "Man: The fourteenth of March, in the afternoon if possible.\n" +
      "Woman: Let me check... yes, the Oak Room is free that afternoon, from 1 to 4pm. It holds up to twenty-two people.\n" +
      "Man: That's perfect, we'll have about eighteen.\n" +
      "Woman: Great. And can I get a contact phone number?\n" +
      "Man: Yes, it's oh-seven-nine-oh, four-four-one, two-two-eight.\n" +
      "Woman: Got it. The room hire is thirty-five pounds for the three hours. Would you like tea and coffee included? That's an extra fifteen pounds.\n" +
      "Man: Yes, let's add that.\n" +
      "Woman: No problem — I'll send a confirmation email once payment is received.",
    groups: [
      {
        id: "g1", type: "gapfill",
        instruction: "Complete the booking form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
        items: [
          { num: 1, prompt: "Name: Daniel {{blank}}", answers: ["Whitfield"], explanation: "Spelled out: 'W-H-I-T-F-I-E-L-D'." },
          { num: 2, prompt: "Date requested: the {{blank}} of March", answers: ["fourteenth", "14th"], explanation: "'The fourteenth of March'." },
          { num: 3, prompt: "Room booked: the {{blank}} Room", answers: ["Oak"], explanation: "'The Oak Room is free that afternoon'." },
          { num: 4, prompt: "Room capacity: up to {{blank}} people", answers: ["twenty-two", "22"], explanation: "'It holds up to twenty-two people'." },
          { num: 5, prompt: "Number of attendees expected: {{blank}}", answers: ["eighteen", "18"], explanation: "'we'll have about eighteen'." },
          { num: 6, prompt: "Room hire cost: £{{blank}}", answers: ["35", "thirty-five"], explanation: "'thirty-five pounds for the three hours'." },
          { num: 7, prompt: "Extra cost for tea and coffee: £{{blank}}", answers: ["15", "fifteen"], explanation: "'an extra fifteen pounds'." },
        ],
      },
      {
        id: "g2", type: "mcq",
        instruction: "Choose the correct letter, A, B or C.",
        items: [
          {
            num: 8, prompt: "The booking will be confirmed once the centre receives",
            options: [["A", "a signed form"], ["B", "payment"], ["C", "a phone call"]],
            answer: "B", explanation: "'I'll send a confirmation email once payment is received.'",
          },
        ],
      },
    ],
  },
];