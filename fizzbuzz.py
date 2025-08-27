"""Simple FizzBuzz implementation."""

from __future__ import annotations


def fizzbuzz(n: int) -> str:
    """Return the FizzBuzz value for a given integer.

    * If ``n`` is divisible by 3, return ``"Fizz"``.
    * If ``n`` is divisible by 5, return ``"Buzz"``.
    * If ``n`` is divisible by both 3 and 5, return ``"FizzBuzz"``.
    * Otherwise return ``str(n)``.
    """
    result = ""
    if n % 3 == 0:
        result += "Fizz"
    if n % 5 == 0:
        result += "Buzz"
    return result or str(n)
