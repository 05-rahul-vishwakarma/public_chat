"use client";

import { useSession } from "next-auth/react";
import { use, useEffect, useState } from "react";
import ChatBox from "./ChatBox";
import Loader from "./Loader";
import { pusherClient } from "@lib/pusher";
import { AiFillFolderAdd } from "react-icons/ai";
import Contacts from "./Contacts";
import { RxCross2 } from "react-icons/rx";
import { MdArrowForwardIos } from "react-icons/md";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";


const animateBox = {
  show: {
    height: "20%",
    opacity: 1,
    duration: 1,
  },
  hide: {
    height: "0",
    opacity: 0,
    duration: 0,
  },
}

const ChatList = ({ currentChatId }) => {
  const { data: sessions } = useSession();
  const currentUser = sessions?.user;

  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState("");
  const [isScaled, setIsScaled] = useState(false);
  const [showBtn, setShowbtn] = useState(true)

  const [isContactPage, setContactPage] = useState(true);


  const handleButtonClick = () => {
    setIsScaled(!isScaled);
    setShowbtn(!showBtn)
  };

  const getChats = async () => {
    try {
      const res = await fetch(
        search !== ""
          ? `/api/users/${currentUser._id}/searchChat/${search}`
          : `/api/users/${currentUser._id}`
      );
      const data = await res.json();
      setChats(data);
      setLoading(false);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      getChats();
    }
  }, [currentUser, search]);

  useEffect(() => {
    if (currentUser) {
      pusherClient.subscribe(currentUser._id);

      const handleChatUpdate = (updatedChat) => {
        setChats((allChats) =>
          allChats.map((chat) => {
            if (chat._id === updatedChat.id) {
              return { ...chat, messages: updatedChat.messages };
            } else {
              return chat;
            }
          })
        );
      };

      const handleNewChat = (newChat) => {
        setChats((allChats) => [...allChats, newChat]);
      }

      pusherClient.bind("update-chat", handleChatUpdate);
      pusherClient.bind("new-chat", handleNewChat);

      return () => {
        pusherClient.unsubscribe(currentUser._id);
        pusherClient.unbind("update-chat", handleChatUpdate);
        pusherClient.unbind("new-chat", handleNewChat);
      };
    }
  }, [currentUser]);

  return loading ? (
    <Loader />
  ) : (
    <>

      <div className="chat-list  ">
        <input
          placeholder="Search chat..."

          className="input-search mt-2 "
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="chats ">
          {chats?.map((chat, index) => (
            <ChatBox
              chat={chat}
              index={index}
              currentUser={currentUser}
              currentChatId={currentChatId}
            />
          ))}

          {
            showBtn &&
            <div
              onClick={() => handleButtonClick()}
              className="z-[2] absolute right-[12%] top-[85%] p-2 rounded-md bg-blue-900 hover:to-blue-300 md:hidden " >
              <AiFillFolderAdd className="text-[1.5rem] text-[rgb(255,255,255)]  cursor-pointer " />
            </div>

          }

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: isScaled ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            className="shadow-md p-2  border-2 h-min w-[65%] z-[2] absolute right-[1%] top-[70%]  rounded-md bg-blue-2  ">


            <Link href={"/profile"} >
              <div className="shadow-md p-2 rounded-xl bg-[white] mb-3 flex justify-between items-center hover:to-blue-2  " >
                <p>Profile</p>
                <MdArrowForwardIos />
              </div>
            </Link>

            <Link href={"/contacts"} >
              <div className="shadow-md p-2 rounded-xl bg-[white] flex justify-between items-center4  hover:to-blue-2 " >
                <p>Contacts</p>
                <MdArrowForwardIos />
              </div>
            </Link>

            <div
              onClick={() => handleButtonClick()}
              className=" mt-2 ml-1 cursor-pointer " >
              <RxCross2 className="text-[2rem] " />
            </div>


          </motion.div>


        </div>
      </div>




    </>
  );
};

export default ChatList;
