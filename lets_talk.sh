#!/bin/bash

function help () {
  cat << EOF
usage: ./lets_talk.sh OR sudo PORt-80 ./lets_talk.sh

Wrapper script for launching the "Let's Talk!" application with docker-compose.
Probably cross-compatible with POSIX-compliant shells.

optional arguments:
  -h      show this help message and exit
  -c      delete the MySQL database before starting, a new one will be created.
          This flag doesn't work with Windows.
  -b      (re-)build images.
  -n      don't start the server.
  -p      prune orphaned docker stuff.
  -d      start server with development configuration (mount server folders instead of copying).
  -w      force use of Windows workarounds.
  -u      ignore detection of Windows + Docker Toolbox, forces regular docker configuration.
  -i NIC  specify the network interface for private IPv4 address. (default: enp3s0)
          Examples: enp3s0, eth0, wlan1, wlp2s0
          Special case: if you are using docker-machine (which is employed by Docker Toolbox),
          use the keyword "machine" as the parameter. ./lets_talk.sh -i machine
EOF
}

[ "$1" = "--help" ] && help && exit 0

# default values
clean=0
nic=enp3s0
skip=0
dev=0
build=0
prune=0
windows=0

# output colors
red=$(tput setaf 1)
dim=$(tput dim)
reset=$(tput sgr0)
bold=$(tput bold)
underline=$(tput smul)

function incompat () {
  n=$skip
  d=$dev
  w=0 && [ "$windows" = "on" ] && w=1
  u=0 && [ "$windows" = "off" ] && w=1
  
  for flag in "$@"; do 
    eval value='$'$flag
    if [ "$value" = "1" ]; then
      help
      echo "${red}Incompatible flags ${bold}-$opt${reset}${red} and ${bold}-$flag${reset}" >&2
      exit 1
    fi
  done
  unset value n d w u
}

while getopts ":hcbnpwudi:" opt; do
  case $opt in
  h   ) help && exit 0           ;;
  c   ) clean=1                  ;;
  b   ) build=1                  ;;
  n   ) skip=1                   ;;
  p   ) prune=1                  ;;
  w   ) incompat c d
    windows=on && nic=machine    ;;
  u   ) incompat w
    windows=off                  ;;
  d   ) incompat n w
    dev=1                        ;;
  i   ) nic=${OPTARG,,}          ;;
  \?  ) help && echo "${red}Invalid option: ${bold}-$OPTARG${reset}" >&2
    exit 1 ;;
  :   ) help && echo "${red}Option ${bold}-$OPTARG${reset}${red} requires an argument.${reset}" >&2 
    exit 1 ;;
  esac
done

printf "\n\t%s\n\n" "$(tput setaf 2)Let's Talk! $(tput setaf 6)└( ^o^)$(tput setaf 4)Ｘ$(tput setaf 5)(^◡^ )ノ$reset"

# system information ==================
private_ip=none
personal=localhost
is_systemd=0

# check if system uses systemd
which systemctl 1> /dev/null 2> /dev/null && systemctl > /dev/null && is_systemd=1
uname=$(uname)
info="${dim}Server info autodetection:${reset} $uname"
warn="$(tput setaf 3)WARNING${reset}:"
if [ "$is_systemd" -eq "1" ]; then
  info="$info (systemd)"
elif [[ ${uname^^} = *"MINGW"* ]]; then # try to detect Docker Quickstart Terminal
  has_machine=0 && which docker-machine 1> /dev/null 2> /dev/null && has_machine=1;
  if [ "$has_machine" = "1" ]; then 
    info="$info (Docker Quickstart terminal on Windows)"
    if [ "$windows" = "off" ]; then
      info="$warn detected environment to be $uname and docker-machine to be installed."
      info="$info\nWindows workarounds have been disabled by the flag \"-u\", behavior might be unstable."
    elif [ "$windows" = "0" ]; then
      windows=1;
      nic=machine;
    fi  
  fi
  unset has_machine
else
  info="$warn found environment to be $uname but systemd was not detected."
  info="$info\nThis setup has not been tested, behavior might be unstable."
fi

if [[ ${uname^^} = *"LINUX"* ]] && [ "$windows" = "on" ]; then
  info="$warn found environment to be $uname but the flag \"-w\" forces the use of Windows workarounds."
fi

info="$info$reset"
echo $info 1>&2
unset info warn uname

# IP addresses & URLs ===========================

if [ "$nic" = "machine" ]; then
  personal=$(docker-machine ip)
  [ "$?" -ne 0 ] && personal=1
elif which ip 1> /dev/null 2> /dev/null ; then # maybe UNIX?
  private_ip=$(ip addr show $nic | awk '/inet / {sub(/\/.*/, "", $2); print $2}')
fi

function running () {
  [ "$is_systemd" -eq "0" ] && return 2 # current machine does not use systemd
  systemctl is-active --quiet $1        # checks if the service is running
  # always returns 0 if service is active
  # returns 3 if machine usus systemd but the service is dead
}

PORT=${PORT:-8080}

if [[ $PORT = 80 ]]; then
  disp_port=""
else
  disp_port=":$PORT"
fi

strf="%-30s%s\n"
prefix='http://'

[ "$personal" != "1" ] && \
printf $strf "${dim}Local:${reset}" "${bold}${underline}${prefix}${personal}${disp_port}/${reset}"
running avahi-daemon && \
printf $strf "${dim}Avahi mDNS:${reset}" "${bold}${underline}${prefix}$(hostname).local${disp_port}/${reset}"
[[ $private_ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]] && \
printf $strf "${dim}Private IP (LAN):${reset}" "${bold}${underline}${prefix}${private_ip}${disp_port}/${reset}"


# if machine uses systemd and docker is inactive, let's try to start it
running docker
if [ "$?" -eq "3" ]; then
  set -x
  systemctl start docker
  { set +x; } 2> /dev/null
fi

# do stuff ======================================

set -e # quit on failure

if [ "$prune" = "1" ]; then
  echo "I hope you know what you're doing..."
  echo "If you use docker for other projects besides Let's Talk, \"-p\" is a danerous flag to set."
  set -x
  PORT=$PORT docker-compose down -v
  docker system prune
  docker volume prune
  { set +x; } 2> /dev/null
fi

# host mount point for MySQL data
db=database/sql
mkdir -p $db

# purge database files if asked to
if [ "$clean" = "1" ]; then
  set -x
  sudo rm -r $db
  mkdir $db
  { set +x; } 2> /dev/null
fi

if [ "$build" = "1" ]; then
  set -x
  PORT=$PORT docker-compose build
  { set +x; } 2> /dev/null
fi

if [ "$skip" = "0" ]; then

  if [ "$windows" = "0" ]; then
    if [ "$dev" = "1" ]; then
      PORT=$PORT docker-compose --file dev-compose.yml up --abort-on-container-exit
    else
      PORT=$PORT docker-compose up --abort-on-container-exit # run normally
    fi
  else
    PORT=$PORT docker-compose --file windows-compose.yml up --abort-on-container-exit # TODO test
  fi
else
  echo 'The flag "-n" was specified. Exiting now...'
fi
