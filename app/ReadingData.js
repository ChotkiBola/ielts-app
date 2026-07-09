export const READING_SETS = [
  {
    id: "r1",
    title: "The Silent Language of Plants",
    minutes: 20,
    paragraphs: [
      "For centuries, plants were regarded as passive organisms, rooted in place and incapable of anything resembling communication. Recent research, however, has revealed a far more dynamic picture. When a caterpillar begins to chew on a leaf, the plant does not simply endure the damage; within minutes, it releases a cocktail of volatile organic compounds into the air. These airborne chemicals serve several purposes at once: they can repel the attacking insect, attract predatory wasps that hunt caterpillars, and, remarkably, warn neighbouring plants of the same species that an attack is underway.",
      "The neighbouring plants, upon detecting these chemical signals, begin producing their own defensive compounds before any actual damage occurs to them. Scientists describe this as a form of eavesdropping rather than deliberate signalling, since the plant releasing the chemicals is not acting for the benefit of its neighbours; it is simply responding to injury. Nonetheless, the effect is functionally similar to communication, and some researchers have started using the term 'plant talk' to describe it, despite the controversy this framing has caused among biologists who resist attributing intent to organisms without a nervous system.",
      "Underground, a second and arguably more sophisticated network operates. The roots of most land plants form partnerships with mycorrhizal fungi, thread-like organisms that colonise root tissue and extend far beyond it through the soil. This fungal network can physically connect the root systems of separate plants, even those of different species, creating what some scientists have nicknamed the 'wood wide web'. Through this network, plants have been shown to exchange not only water and nutrients but also warning signals about insect attacks and drought stress.",
      "One widely cited study found that a wounded tomato plant could trigger defensive gene expression in a neighbouring, undamaged tomato plant connected only through a shared fungal network, with no direct physical contact between the two root systems and no airborne chemicals involved. This finding has been difficult to replicate outside controlled laboratory conditions, and critics point out that field environments are far messier, with many species and fungal partners overlapping unpredictably.",
      "Despite the unresolved debates, the discovery of these chemical and fungal communication systems has practical implications for agriculture. Some researchers are investigating whether crops could be bred or treated to become more sensitive to these natural warning signals, potentially reducing the need for chemical pesticides. Others urge caution, noting that laboratory findings do not always translate into reliable results in the variable conditions of a working farm.",
    ],
    groups: [
      {
        id: "g1", type: "gapfill",
        instruction: "Complete the notes below. Write NO MORE THAN TWO WORDS for each answer.",
        items: [
          { num: 1, prompt: "When attacked, a plant releases volatile compounds that can attract {{blank}} which hunt the attacking insect.", answers: ["predatory wasps", "wasps"], explanation: "Paragraph 1: the compounds 'attract predatory wasps that hunt caterpillars'." },
          { num: 2, prompt: "Neighbouring plants that detect these chemicals are described by scientists as {{blank}} rather than receiving a deliberate message.", answers: ["eavesdropping"], explanation: "Paragraph 2: 'Scientists describe this as a form of eavesdropping'." },
          { num: 3, prompt: "Underground, plant roots connect through a network formed by {{blank}}.", answers: ["mycorrhizal fungi", "fungi"], explanation: "Paragraph 3: 'partnerships with mycorrhizal fungi'." },
          { num: 4, prompt: "This underground network is sometimes nicknamed the {{blank}}.", answers: ["wood wide web"], explanation: "Paragraph 3: 'what some scientists have nicknamed the \"wood wide web\"'." },
          { num: 5, prompt: "One study found gene expression changes in a tomato plant connected only through a shared {{blank}}.", answers: ["fungal network"], explanation: "Paragraph 4: 'connected only through a shared fungal network'." },
        ],
      },
      {
        id: "g2", type: "matching",
        instruction: "Look at the following statements and match each one with the correct paragraph, A–E.",
        options: [["A", "Paragraph 1"], ["B", "Paragraph 2"], ["C", "Paragraph 3"], ["D", "Paragraph 4"], ["E", "Paragraph 5"]],
        items: [
          { num: 6, prompt: "A possible practical application of this research in farming", answer: "E", explanation: "Paragraph 5 discusses agricultural implications." },
          { num: 7, prompt: "A description of how a below-ground network can link different plants together", answer: "C", explanation: "Paragraph 3 introduces the mycorrhizal network." },
          { num: 8, prompt: "A term used by some scientists that has caused disagreement among biologists", answer: "B", explanation: "Paragraph 2: the term 'plant talk' and the controversy it caused." },
        ],
      },
      {
        id: "g3", type: "tfng",
        instruction: "Do the following statements agree with the information given in the passage? Write TRUE, FALSE, or NOT GIVEN.",
        items: [
          { num: 9, prompt: "Plants were once thought to be completely passive organisms.", answer: "TRUE", explanation: "Paragraph 1: 'plants were regarded as passive organisms'." },
          { num: 10, prompt: "A plant releases chemicals specifically to help its neighbouring plants.", answer: "FALSE", explanation: "Paragraph 2: the plant 'is not acting for the benefit of its neighbours; it is simply responding to injury'." },
          { num: 11, prompt: "All biologists agree that plants are capable of intentional communication.", answer: "FALSE", explanation: "Paragraph 2 mentions 'controversy... among biologists who resist attributing intent'." },
          { num: 12, prompt: "The tomato plant study has been easy to reproduce in real farm conditions.", answer: "FALSE", explanation: "Paragraph 4: 'difficult to replicate outside controlled laboratory conditions'." },
          { num: 13, prompt: "Some scientists believe this research could eventually reduce pesticide use.", answer: "TRUE", explanation: "Paragraph 5: crops 'more sensitive to these natural warning signals, potentially reducing the need for chemical pesticides'." },
        ],
      },
    ],
  },
];