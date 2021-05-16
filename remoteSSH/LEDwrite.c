#include <sys/stat.h>
#include <sys/types.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

#define IN 0
#define OUT 1
#define LOW 0
#define HIGH 1
#define PIN 20
#define POUT 17
#define POUT2 21
#define VALUE_MAX 40

static int GPIOExport(int pin)
{
#define BUFFER_MAX 3
    char buffer[BUFFER_MAX];
    ssize_t bytes_written;
    int fd;

    fd = open("/sys/class/gpio/export", O_WRONLY);
    if (-1 == fd)
    {
        fprintf(stderr, "failed to open\n");
        return (-1);
    }
    bytes_written = snprintf(buffer, BUFFER_MAX, "%d", pin);
    write(fd, buffer, bytes_written);
    close(fd);
    return (0);
}

static int GPIOUnexport(int pin)
{
    char buffer[BUFFER_MAX];
    ssize_t bytes_written;
    int fd;

    fd = open("/sys/class/gpio/unexport", O_WRONLY);
    if (-1 == fd)
    {
        fprintf(stderr, "failed to open");
        return (-1);
    }
    bytes_written = snprintf(buffer, BUFFER_MAX, "%d", pin);
    write(fd, buffer, bytes_written);
    close(fd);
    return (0);
}

static int GPIODirection(int pin, int dir)
{
    static const char s_directions_str[] = "in\0out";
#define DIRECTION_MAX 35
    //char path[DIRECTION_MAX]="/sys/class/gpio/gpio24/direction";
    char path[DIRECTION_MAX] = "/sys/class/gpio/gpio%d/direction";
    int fd;
    snprintf(path, DIRECTION_MAX, "/sys/class/gpio/gpio%d/direction", pin);
    fd = open(path, O_WRONLY);
    if (-1 == fd)
    {
        fprintf(stderr, "failed to open.\n");
        return (-1);
    }
    if (-1 == write(fd, &s_directions_str[IN == dir ? 0 : 3], IN == dir ? 2 : 3))
    {
        fprintf(stderr, "failed to set dir\n");
        return (-1);
    }

    close(fd);
    return (0);
}

static int GPIORead(int pin)
{
    char path[VALUE_MAX];
    char value_str[3];
    int fd;
    snprintf(path, VALUE_MAX, "/sys/class/gpio/gpio%d/value", pin);
    fd = open(path, O_RDONLY);
    if (-1 == fd)
    {
        fprintf(stderr, "fail to open gpio value for reading\n");
        return (-1);
    }
    if (-1 == read(fd, value_str, 3))
    {
        fprintf(stderr, "failed to read value\n");
        return (-1);
    }
    close(fd);
    return (atoi(value_str));
}

static int GPIOWrite(int pin, int value)
{
    static const char s_values_str[] = "01";

    char path[VALUE_MAX];
    int fd;

    snprintf(path, VALUE_MAX, "/sys/class/gpio/gpio%d/value", pin);
    fd = open(path, O_WRONLY);
    if (-1 == fd)
    {
        fprintf(stderr, "failed to open gpio value for writing\n");
        return (-1);
    }
    if (1 != write(fd, &s_values_str[LOW == value ? 0 : 1], 1))
    {
        fprintf(stderr, "failed to write value\n");
        return (-1);
        close(fd);
        return (0);
    }
}

int main(int argc, char *argv[])
{
    int repeat = 100;
    int state = 1;
    int prev_state = 0;
    int light = 0;

    if (-1 == GPIOExport(POUT) || -1 == GPIOExport(POUT2) || -1 == GPIOExport(PIN))
        return (1);

    if (-1 == GPIODirection(POUT, OUT) || -1 == GPIODirection(POUT2, OUT) || -1 == GPIODirection(PIN, IN))
        return (2);

    do
    {
        printf("I'm reading %d in GPIO %d\n", GPIORead(PIN), PIN);
        if (-1 == GPIOWrite(POUT2, 1))
            return (3);
        if (GPIORead(PIN) == 0)
        {
            while (GPIORead(PIN) != 1)
            {
                //printf("I'm reading %d in GPIO %d\n", GPIORead(PIN), PIN);
                continue;
            }
            GPIOWrite(POUT, state);
            int temp = state;
            state = prev_state;
            prev_state = temp;
        }

        usleep(100000);

    }

    while (repeat--);
    if (-1 == GPIOUnexport(POUT2) || -1 == GPIOUnexport(PIN))
        return (4);
    return (0);
}
