import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { GrClose } from "react-icons/gr";
import {
  TiSocialFacebook,
  TiSocialLinkedin,
  TiSocialTwitter,
  TiSocialYoutube,
  TiSocialInstagram,
  TiArrowSortedDown,
} from "react-icons/ti";
import { DiJqueryUiLogo } from "react-icons/di";

import Style from "./SideBar.module.css";
import Button from "../../Button/Button";

const SideBar = ({ setOpenSideMenu, currentAccount, connectWallet }) => {
  const [openExplore, setOpenExplore] = useState(false);
  const [openLearnMore, setOpenLearnMore] = useState(false);

  const router = useRouter();

  const explore = [
    {
      name: "Author",
      link: "author",
    },
    {
      name: "Search",
      link: "searchPage",
    },
    {
      name: "Create NFT",
      link: "uploadNFT",
    },
    {
      name: "Update Listing Price",
      link: "updateListingPrice",
    },
  ];

  const learnMore = [
    {
      name: "About",
      link: "aboutus",
    },
    {
      name: "Contact Us",
      link: "contactus",
    },
  ];

  const openExploreMenu = () => {
    if (!openExplore) {
      setOpenExplore(true);
      setOpenLearnMore(false);
    } else {
      setOpenExplore(false);
    }
  };

  const openLearnMoreMenu = () => {
    if (!openLearnMore) {
      setOpenLearnMore(true);
      setOpenExplore(false);
    } else {
      setOpenLearnMore(false);
    }
  };

  const closeSideBar = () => {
    setOpenSideMenu(false);
  };

  return (
    <div className={Style.sideBar}>
      <GrClose
        className={Style.sideBar_closeBtn}
        onClick={() => closeSideBar()}
      />

      <div className={Style.sideBar_box_container}>
        <p>
          <a href="/">
            <DiJqueryUiLogo className={Style.sideBar_box_container_logo} />
          </a>
        </p>

        <div className={Style.sideBar_social}>
          <a
            href="https://www.facebook.com/profile.php?id=100009096397038"
            target="_blank"
          >
            <TiSocialFacebook />
          </a>
          <a
            href="https://www.linkedin.com/in/oluwatimilehin-bello/"
            target="_blank"
          >
            <TiSocialLinkedin />
          </a>
          <a href="https://twitter.com/Timmee_Bello" target="_blank">
            <TiSocialTwitter />
          </a>
          <a
            href="https://www.youtube.com/channel/UCDyKFRctmBNBRm1o8-MY4hA"
            target="_blank"
          >
            <TiSocialYoutube />
          </a>
          <a href="https://www.instagram.com/teemee_bello/" target="_blank">
            <TiSocialInstagram />
          </a>
        </div>
      </div>

      <div className={Style.sideBar_nav}>
        <div
          className={Style.sideBar_nav_container}
          onClick={() => openExploreMenu()}
        >
          <p>Explore</p>
          <TiArrowSortedDown />
        </div>

        {openExplore && (
          <div className={Style.sideBar_explore}>
            {explore.map((el, i) => (
              <p key={i + 1}>
                <Link href={{ pathname: `${el.link}` }}>{el.name}</Link>
              </p>
            ))}
          </div>
        )}

        <div>
          <div
            className={Style.sideBar_nav_container}
            onClick={() => openLearnMoreMenu()}
          >
            <p>Learn More</p>
            <TiArrowSortedDown />
          </div>

          {openLearnMore && (
            <div className={Style.sideBar_explore}>
              {learnMore.map((el, i) => (
                <p key={i + 1}>
                  <Link href={{ pathname: `${el.link}` }}>{el.name}</Link>
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={Style.sideBar_button}>
        {currentAccount == "" ? (
          <Button btnName="connect" handleClick={() => connectWallet()} />
        ) : (
          <Button
            btnName="Create"
            handleClick={() => router.push("/uploadNFT")}
          />
        )}
      </div>
    </div>
  );
};

export default SideBar;
