import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCheck, Battery, Wifi, Signal } from "lucide-react";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  time: string;
}

const DEMO_CHAT: Message[] = [
  { id: 1, text: "I just sell 3 bag of rice for 45,000 naira", sender: "user", time: "10:30 AM" },
  { id: 2, text: "✅ Logged: Sale of 3 bags of rice for ₦45,000.\nYour total sales today: ₦120,500.", sender: "bot", time: "10:30 AM" },
  { id: 3, text: "I pay mama chinedu 15k wey I owe am", sender: "user", time: "11:15 AM" },
  { id: 4, text: "✅ Logged: Debt repayment of ₦15,000 to Mama Chinedu.\nRemaining debt: ₦5,000.", sender: "bot", time: "11:16 AM" },
  { id: 5, text: "Make you show me my profit for this week", sender: "user", time: "02:45 PM" },
  { id: 6, text: "📊 This week's summary:\nSales: ₦340,000\nExpenses: ₦115,000\nNet Profit: ₦225,000\n\nYou are doing great! Keep it up. 🚀", sender: "bot", time: "02:46 PM" },
];

export function PhoneSimulator() {
  const [messages, setMessages] = useState<Message[]>([DEMO_CHAT[0]]);
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    let currentIndex = 1;
    const interval = setInterval(() => {
      if (currentIndex < DEMO_CHAT.length) {
        if (DEMO_CHAT[currentIndex].sender === "bot") {
          setTyping(true);
          setTimeout(() => {
            setMessages((prev) => [...prev, DEMO_CHAT[currentIndex]]);
            setTyping(false);
            currentIndex++;
          }, 1500);
        } else {
          setMessages((prev) => [...prev, DEMO_CHAT[currentIndex]]);
          currentIndex++;
        }
      } else {
        clearInterval(interval);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative mx-auto w-[320px] h-[650px] rounded-[3rem] border-8 border-(--bg-secondary) bg-[#0b141a] shadow-2xl shadow-(--shadow-glow-green) overflow-hidden ring-1 ring-white/10">
      {/* Top Notch / Status Bar */}
      <div className="absolute top-0 inset-x-0 h-6 flex items-center justify-between px-6 text-[10px] font-medium text-white/90 z-20">
        <span>9:41</span>
        <div className="flex items-center gap-1.5">
          <Signal className="w-3 h-3" />
          <Wifi className="w-3 h-3" />
          <Battery className="w-[14px] h-[14px]" />
        </div>
      </div>
      <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-20">
        <div className="w-32 h-6 bg-(--bg-secondary) rounded-b-3xl"></div>
      </div>

      {/* WhatsApp Header */}
      <div className="absolute top-0 inset-x-0 h-24 bg-[#202c33] flex items-end px-4 pb-3 z-10 shadow-md">
        <div className="flex items-center gap-3 w-full pt-6">
          <div className="w-10 h-10 rounded-full bg-(--green-500) flex items-center justify-center shrink-0 border border-white/10 p-1">
             <img src="/logo.png" alt="Bot" className="w-full h-full object-contain filter invert" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-medium text-base">SMB AI Assistant</h3>
            <p className="text-[#8696a0] text-xs font-mono">{typing ? "typing..." : "online"}</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="absolute inset-0 pt-24 pb-20 px-4 overflow-y-auto no-scrollbar flex flex-col gap-4 bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover bg-center before:content-[''] before:absolute before:inset-0 before:bg-[#0b141a]/90">
        <div className="relative z-10 flex flex-col gap-4 mt-4">
          <div className="text-center">
             <span className="bg-[#182229] text-[#8696a0] text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-lg">Today</span>
          </div>
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 relative backdrop-blur-md whitespace-pre-wrap text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[#005c4b] text-[#e9edef] rounded-tr-sm"
                      : "bg-[#202c33] text-[#e9edef] rounded-tl-sm border border-white/5 shadow-lg"
                  }`}
                >
                  {msg.text}
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] text-white/50">{msg.time}</span>
                    {msg.sender === "user" && <CheckCheck className="w-3 h-3 text-[#53bdeb]" />}
                  </div>
                </div>
              </motion.div>
            ))}
            {typing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                 <div className="bg-[#202c33] text-[#e9edef] rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce delay-200"></div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-[#202c33] px-2 py-2 flex items-center gap-2 z-10">
         <div className="flex-1 bg-[#2a3942] rounded-full h-10 px-4 flex items-center text-[#8696a0] text-sm">
            Message
         </div>
         <div className="w-10 h-10 shrink-0 bg-[#00a884] rounded-full flex items-center justify-center text-white">
            <Send className="w-4 h-4 ml-[-2px]" />
         </div>
      </div>
    </div>
  );
}
